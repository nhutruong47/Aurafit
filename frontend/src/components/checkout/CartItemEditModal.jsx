// Cart Item Edit Modal — Luxury Editorial style with Shopee-style variant selectors.
// Allows editing Size, Color, Dates, and Quantity with real-time stock validation.
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCostumeItems } from '../../services/costumeService';
import { setCartItems } from '../../store/cartSlice';
import { useToastStore } from '../../store/useToastStore';
import { removeCartItem, addItemToCart, fetchCart } from '../../services/cartService';

export default function CartItemEditModal({ item, isOpen, onClose, onSaved }) {
  const dispatch = useDispatch();
  const addToast = useToastStore((s) => s.addToast);
  const cartItems = useSelector((state) => state.cart.items);

  // Available items from the API (CostumeItemDTO[])
  const [availableItems, setAvailableItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Editable state
  const [selectedSize, setSelectedSize] = useState(item?.size || '');
  const [selectedColor, setSelectedColor] = useState(item?.color || '');
  const [editStartDate, setEditStartDate] = useState(item?.rentalStartDate || '');
  const [editEndDate, setEditEndDate] = useState(item?.rentalEndDate || '');
  const [editQuantity, setEditQuantity] = useState(item?.quantity || 1);
  const [dateError, setDateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getLocalDateString = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getLocalDateString();

  // Fetch available items when modal opens
  useEffect(() => {
    if (!isOpen || !item?.costumeId) return;
    setIsLoadingItems(true);
    fetchCostumeItems(item.costumeId)
      .then((items) => {
        setAvailableItems(items || []);
      })
      .catch(() => {
        setAvailableItems([]);
      })
      .finally(() => setIsLoadingItems(false));
  }, [isOpen, item?.costumeId]);

  // Reset edit state when item changes
  useEffect(() => {
    if (item) {
      setSelectedSize(item.size || '');
      setSelectedColor(item.color || '');
      setEditStartDate(item.rentalStartDate || '');
      setEditEndDate(item.rentalEndDate || '');
      setEditQuantity(item.quantity || 1);
      setDateError('');
    }
  }, [item]);

  // ── Derived: unique sizes and colors ──
  const uniqueSizes = useMemo(() => {
    if (!availableItems.length) return [];
    return [...new Set(availableItems.map((i) => i.size || ''))];
  }, [availableItems]);

  const availableColorsForSize = useMemo(() => {
    if (!availableItems.length) return [];
    if (!selectedSize && uniqueSizes.length === 0) {
      return [...new Set(availableItems.map((i) => i.color || ''))];
    }
    return [...new Set(
      availableItems
        .filter((i) => (i.size || '') === selectedSize)
        .map((i) => i.color || '')
    )];
  }, [availableItems, selectedSize, uniqueSizes]);

  // ── Find exact matching CostumeItem ──
  const matchedItem = useMemo(() => {
    const found = availableItems.find(
      (i) => (i.size || '') === selectedSize && (i.color || '') === selectedColor
    );
    if (found) return found;

    // Hotfix: If not found in available items, but matches the currently held item
    const isCurrentVariant = (item?.size || '') === selectedSize && (item?.color || '') === selectedColor;
    if (isCurrentVariant) {
      return { id: item.costumeItemId, size: item.size, color: item.color };
    }
    return null;
  }, [availableItems, selectedSize, selectedColor, item]);

  // ── Stock validation ──
  // Count how many of this exact variant are already in cart (excluding current item being edited)
  const inCartQty = useMemo(() => {
    return cartItems
      .filter((ci) => {
        if (ci.cartId === item?.cartId) return false; // Exclude current item
        const matchesCostume = ci.costumeId === item?.costumeId;
        const matchesSize = (ci.size || '') === selectedSize;
        const matchesColor = (ci.color || '') === selectedColor;
        return matchesCostume && matchesSize && matchesColor;
      })
      .reduce((sum, ci) => sum + (ci.quantity || 1), 0);
  }, [cartItems, item?.cartId, item?.costumeId, selectedSize, selectedColor]);

  // Count available stock for the variant (simple count of AVAILABLE items with matching size+color)
  const totalVariantStock = useMemo(() => {
    let count = availableItems.filter(
      (i) => (i.size || '') === selectedSize &&
             (i.color || '') === selectedColor &&
             i.status === 'AVAILABLE'
    ).length;

    // Hotfix: Ensure the current user's held item is counted if they are editing the same variant
    const isCurrentVariant = (item?.size || '') === selectedSize && (item?.color || '') === selectedColor;
    const isAlreadyInAvailable = availableItems.some((i) => i.id === item?.costumeItemId);
    
    if (isCurrentVariant && !isAlreadyInAvailable) {
      count += 1;
    }

    return count;
  }, [availableItems, selectedSize, selectedColor, item]);

  const baseEffectiveStock = Math.max(0, totalVariantStock - inCartQty);
  
  // Aggressive Override: Force validation to respect the cart
  const isCurrentVariant = (item?.size || '') === selectedSize && (item?.color || '') === selectedColor;
  
  // If the user already owns this variant, it is available and has at least their current quantity
  const effectiveStock = isCurrentVariant 
    ? Math.max(item?.quantity || 1, baseEffectiveStock)
    : baseEffectiveStock;

  const isVariantAvailable = effectiveStock > 0;

  // Clamp quantity when stock changes
  useEffect(() => {
    if (effectiveStock > 0 && editQuantity > effectiveStock) {
      setEditQuantity(effectiveStock);
    }
  }, [effectiveStock, editQuantity]);

  // ── Handlers ──
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    // Auto-select first available color for this size
    const colorsForSize = availableItems
      .filter((i) => (i.size || '') === size)
      .map((i) => i.color || '');
    const uniqueColors = [...new Set(colorsForSize)];
    if (uniqueColors.length > 0 && !uniqueColors.includes(selectedColor)) {
      setSelectedColor(uniqueColors[0]);
    }
    setEditQuantity(1);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setEditQuantity(1);
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setEditStartDate(val);
    setDateError('');
    if (editEndDate && val >= editEndDate) {
      setEditEndDate('');
    }
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (editStartDate && val <= editStartDate) {
      setDateError('Ngày trả phải sau ngày nhận.');
      return;
    }
    setEditEndDate(val);
    setDateError('');
  };

  const canSave = matchedItem && isVariantAvailable && editStartDate && editEndDate && !dateError && editQuantity >= 1 && editQuantity <= effectiveStock;

  const handleSave = async () => {
    if (!canSave || isUpdating) return;

    setIsUpdating(true);
    try {
      const formattedStartDate = getLocalDateString(editStartDate);
      const formattedEndDate = getLocalDateString(editEndDate);

      const isVariantChanged = item.costumeItemId !== matchedItem.id;
      const isDatesChanged = item.rentalStartDate !== formattedStartDate || item.rentalEndDate !== formattedEndDate;

      if (item.cartItemIds && item.cartItemIds.length > 0) {
        const isQuantityChanged = item.quantity !== editQuantity;
        
        // If anything changed, the safest and most robust way in a flat SKU cart system
        // is to delete all existing rows for this variant group and re-add them
        // with the new variant, dates, and total quantity.
        if (isVariantChanged || isDatesChanged || isQuantityChanged) {
          await Promise.all(item.cartItemIds.map(id => removeCartItem(id)));
          await addItemToCart({
            costumeItemId: matchedItem.id,
            rentalStartDate: formattedStartDate,
            rentalEndDate: formattedEndDate,
            quantity: editQuantity
          });
        }
      } else if (item.cartItemId) {
        // Fallback for flat non-grouped items
        const isQuantityChanged = item.quantity !== editQuantity;
        if (isVariantChanged || isDatesChanged || isQuantityChanged) {
          await removeCartItem(item.cartItemId);
          await addItemToCart({
            costumeItemId: matchedItem.id,
            rentalStartDate: formattedStartDate,
            rentalEndDate: formattedEndDate,
            quantity: editQuantity
          });
        }
      }

      // Force redownload of the entire cart from the backend to guarantee absolute sync
      const freshCart = await fetchCart();
      dispatch(setCartItems(freshCart?.items || []));

      addToast('Đã cập nhật sản phẩm trong giỏ hàng.');
      onSaved?.();
      onClose();
    } catch (error) {
      addToast('Cập nhật thất bại: ' + (error.message || 'Vui lòng kiểm tra lại'), 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isUpdating) onClose(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] relative">
        {/* Header (Fixed) */}
        <div className="flex-none px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
          <h2 className="font-serif text-xl uppercase tracking-wide">Chỉnh sửa sản phẩm</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-[#999] transition hover:text-black"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {/* Product Info */}
          <div className="mb-5 flex items-center gap-4">
            <img
              src={item.image}
              alt={item.name}
              className="h-20 w-16 flex-shrink-0 border border-[#e8e4e3] object-cover"
            />
            <div>
              <h3 className="font-serif text-base uppercase tracking-wide">{item.name}</h3>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#99854e]">
                {item.category}
              </p>
            </div>
          </div>

          {isLoadingItems ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-[#999]">Đang tải sản phẩm...</span>
            </div>
          ) : (
            <>
              {/* ── Size Selector ── */}
              {uniqueSizes.length > 0 && !(uniqueSizes.length === 1 && uniqueSizes[0] === '') && (
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                    Kích cỡ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((size) => (
                      <button
                        key={size || '__freesize__'}
                        onClick={() => handleSizeChange(size)}
                        className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-[#cfc4c5] bg-white text-black hover:border-black'
                        }`}
                      >
                        {size || 'Freesize'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Color Selector ── */}
              {availableColorsForSize.length > 0 && !(availableColorsForSize.length === 1 && availableColorsForSize[0] === '') && (
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                    Màu sắc
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableColorsForSize.map((color) => (
                      <button
                        key={color || '__default__'}
                        onClick={() => handleColorChange(color)}
                        className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                          selectedColor === color
                            ? 'border-[#99854e] bg-[#99854e] text-white'
                            : 'border-[#cfc4c5] bg-white text-black hover:border-[#99854e]'
                        }`}
                      >
                        {color || 'Mặc định'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Stock Status ── */}
              <div className="mb-4">
                <span
                  className={`inline-block border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isVariantAvailable
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {isVariantAvailable ? `Còn ${effectiveStock} sản phẩm khả dụng` : 'Hết hàng cho sản phẩm này'}
                </span>
              </div>

              {/* ── Quantity ── */}
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Số lượng</p>
                <div className="flex h-9 w-fit items-center border border-[#cfc4c5]">
                  <button
                    onClick={() => setEditQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-full w-9 items-center justify-center text-black transition hover:bg-[#f9f9f9]"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="flex h-full w-10 items-center justify-center border-x border-[#cfc4c5] text-sm">
                    {editQuantity}
                  </span>
                  <button
                    onClick={() => {
                      if (editQuantity >= effectiveStock) {
                        addToast('Vượt quá số lượng tồn kho khả dụng', 'error');
                        return;
                      }
                      setEditQuantity((q) => q + 1);
                    }}
                    disabled={editQuantity >= effectiveStock}
                    className={`flex h-full w-9 items-center justify-center transition ${
                      editQuantity >= effectiveStock
                        ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                        : 'text-black hover:bg-[#f9f9f9]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>

              {/* ── Date Picker ── */}
              <div className="mb-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Thời gian thuê</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-wide text-[#999]">Ngày nhận</label>
                    <input
                      type="date"
                      value={editStartDate}
                      min={today}
                      onChange={handleStartDateChange}
                      className="w-full border border-[#cfc4c5] bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-wide text-[#999]">Ngày trả</label>
                    <input
                      type="date"
                      value={editEndDate}
                      min={editStartDate ? getLocalDateString(new Date(new Date(editStartDate).getTime() + 86400000)) : today}
                      onChange={handleEndDateChange}
                      className="w-full border border-[#cfc4c5] bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
                {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
              </div>
            </>
          )}
        </div>

        {/* Footer (Fixed Action Buttons) */}
        <div className="flex-none px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="flex-1 border border-[#cfc4c5] py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5e5e] transition hover:border-black hover:text-black"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isUpdating}
            className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              canSave && !isUpdating
                ? 'bg-black text-white hover:bg-[#99854e]'
                : 'opacity-70 cursor-not-allowed bg-black text-white'
            }`}
          >
            {isUpdating ? 'ĐANG XỬ LÝ...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
