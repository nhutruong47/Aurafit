import { useState, useCallback, useEffect } from 'react';
import {
  fetchAdminCostumeItems,
  createCostumeItem,
  updateCostumeItem,
  deleteCostumeItem,
} from '../services/costumeService';
import { useToastStore } from '../store/useToastStore';

export const emptyItemForm = { sku: '', size: '', color: '', status: 'AVAILABLE' };

/**
 * Strips Vietnamese diacritics and returns uppercase ASCII.
 * e.g. "Áo Dài Cưới" -> "AO DAI CUOI"
 */
function stripAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Generates a smart SKU from costume name, size, color, and existing items.
 * Format: [PREFIX]-[SIZE]-[COLOR]-[SEQ]
 * Example: "Áo Dài Cưới", "M", "Đỏ" -> "ADC-M-DO-001"
 */
export function generateSKU(costumeName, size, color, existingItems) {
  // Prefix: initials of costume name words
  const prefix = costumeName
    ? stripAccents(costumeName)
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 5)
    : 'AF';

  const sizeCode = stripAccents(size || '').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'X';
  const colorCode = stripAccents(color || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'X';

  // Find existing items with same size+color to determine next sequence
  const sameVariants = (existingItems || []).filter(
    (item) => item.size === size && item.color === color
  );

  // Extract sequence numbers from existing SKUs matching the pattern
  const basePattern = `${prefix}-${sizeCode}-${colorCode}-`;
  let maxSeq = 0;
  for (const item of sameVariants) {
    if (item.sku && item.sku.startsWith(basePattern)) {
      const seqPart = item.sku.slice(basePattern.length);
      const num = parseInt(seqPart, 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  }
  // Fallback: if no pattern match, use count
  if (maxSeq === 0 && sameVariants.length > 0) {
    maxSeq = sameVariants.length;
  }

  const seq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}-${sizeCode}-${colorCode}-${seq}`;
}

export function useAdminCostumeItems(editingProductId, productName) {
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);

  const loadItems = useCallback(async () => {
    if (!editingProductId) return;
    setIsLoadingItems(true);
    try {
      const data = await fetchAdminCostumeItems(editingProductId);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      useToastStore.getState().addToast(err.message || 'Ui chao, chưa tải được phân loại kho rồi, bạn chờ chút nha! 🥺 🥺', 'error');
    } finally {
      setIsLoadingItems(false);
    }
  }, [editingProductId]);

  const resetItemsState = useCallback(() => {
    setItems([]);
    setItemForm(emptyItemForm);
    setEditingItemId(null);
    setSkuManuallyEdited(false);
  }, []);

  // --- Auto-generate SKU when size or color changes ---
  useEffect(() => {
    if (editingItemId || skuManuallyEdited) return; // Don't override when editing or manually typed
    if (!itemForm.size && !itemForm.color) return;
    const newSku = generateSKU(productName, itemForm.size, itemForm.color, items);
    setItemForm((prev) => ({ ...prev, sku: newSku }));
  }, [itemForm.size, itemForm.color, items, productName, editingItemId, skuManuallyEdited]);

  const handleItemFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sku') {
      setSkuManuallyEdited(true);
    }
    setItemForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveItem = async () => {
    if (!editingProductId) return;
    setIsSavingItem(true);
    try {
      if (editingItemId) {
        const updated = await updateCostumeItem(editingProductId, editingItemId, itemForm);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        useToastStore.getState().addToast('Cập nhật phân loại thành công.', 'success');
        setItemForm(emptyItemForm);
        setEditingItemId(null);
        setSkuManuallyEdited(false);
      } else {
        const created = await createCostumeItem(editingProductId, itemForm);
        const updatedItems = [...items, created];
        setItems(updatedItems);
        useToastStore.getState().addToast('Thêm phân loại thành công.', 'success');
        // Rapid entry: keep size & color, regenerate SKU for next sequence
        setSkuManuallyEdited(false);
        const nextSku = generateSKU(productName, itemForm.size, itemForm.color, updatedItems);
        setItemForm((prev) => ({ ...prev, sku: nextSku }));
      }
    } catch (err) {
      useToastStore.getState().addToast(err.message || 'Lưu phân loại chưa thành công rồi, kiểm tra lại mạng xíu nha! 💖 🥺', 'error');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({ sku: item.sku, size: item.size, color: item.color, status: item.status });
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setItemForm(emptyItemForm);
    setSkuManuallyEdited(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (!editingProductId) return;
    try {
      await deleteCostumeItem(editingProductId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      useToastStore.getState().addToast('Đã xóa phân loại.', 'success');
    } catch (err) {
      useToastStore.getState().addToast(err.message || 'Chưa xóa được phân loại rồi bạn ơi! 🥺 🥺', 'error');
    }
  };

  const handleRegenerateSku = () => {
    setSkuManuallyEdited(false);
    const newSku = generateSKU(productName, itemForm.size, itemForm.color, items);
    setItemForm((prev) => ({ ...prev, sku: newSku }));
  };

  return {
    items,
    isLoadingItems,
    itemForm,
    editingItemId,
    isSavingItem,
    skuManuallyEdited,
    loadItems,
    resetItemsState,
    handleItemFieldChange,
    handleSaveItem,
    handleEditItem,
    handleCancelEditItem,
    handleDeleteItem,
    handleRegenerateSku
  };
}
