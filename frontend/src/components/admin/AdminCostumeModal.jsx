import { useEffect, useRef, useState } from 'react';
import { AdminField } from './AdminDashboardShared';
import ImageGalleryUploadField from '../ui/ImageGalleryUploadField';
import SearchableSelect from '../ui/SearchableSelect';
import { useToastStore } from '../../store/useToastStore';
import { useAdminCostumeItems } from '../../hooks/useAdminCostumeItems';

const TABS = [
  { key: 'general', label: 'Thông tin chung', icon: 'info' },
  { key: 'inventory', label: 'Phân loại kho', icon: 'inventory_2' },
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Sẵn sàng', color: 'border-green-200 bg-green-50 text-green-700' },
  { value: 'RENTED', label: 'Đang thuê', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'MAINTENANCE', label: 'Bảo trì', color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  { value: 'LOST', label: 'Mất', color: 'border-red-200 bg-red-50 text-red-700' },
];

const SIZE_SUGGESTIONS = ['Freesize', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
const COLOR_SUGGESTIONS = ['Trắng', 'Đen', 'Đỏ', 'Xanh dương', 'Xanh lá', 'Vàng', 'Hồng', 'Tím', 'Cam', 'Nâu', 'Xám', 'Be'];

export default function AdminCostumeModal({
  isOpen,
  onClose,
  title,
  editingProductId,
  productForm,
  onProductFieldChange,
  onProductImagesChange,
  onSubmitProduct,
  isSavingProduct,
  productMessage,
  productError,
  categories,
}) {
  const backdropRef = useRef(null);
  const contentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('general');
  const [imageUploadState, setImageUploadState] = useState({ isUploading: false, error: '' });

  const {
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
  } = useAdminCostumeItems(editingProductId, productForm.name);

  // Reset tab when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
      resetItemsState();
      setImageUploadState({ isUploading: false, error: '' });
    }
  }, [isOpen, editingProductId, resetItemsState]);

  useEffect(() => {
    if (activeTab === 'inventory' && editingProductId) {
      loadItems();
    }
  }, [activeTab, editingProductId, loadItems]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Click-outside (mousedown on backdrop)
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e) => {
      if (backdropRef.current === e.target) onClose();
    };
    const el = backdropRef.current;
    if (el) el.addEventListener('mousedown', handleMouseDown);
    return () => { if (el) el.removeEventListener('mousedown', handleMouseDown); };
  }, [isOpen, onClose]);

  const handleSubmitGeneral = async (e) => {
    e.preventDefault();

    if (imageUploadState.isUploading) {
      useToastStore.getState().addToast('Vui lòng chờ ảnh tải lên hoàn tất trước khi lưu sản phẩm.', 'error');
      return;
    }

    if (imageUploadState.error) {
      useToastStore.getState().addToast(
        `Không thể lưu sản phẩm vì có ảnh tải lên thất bại: ${imageUploadState.error}`,
        'error'
      );
      return;
    }

    await onSubmitProduct(e);
  };

  if (!isOpen) return null;

  const statusBadge = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
    return (
      <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${opt.color}`}>
        {opt.label}
      </span>
    );
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px]"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isSavingProduct) onClose(); }}
    >
      <div
        ref={contentRef}
        className="relative flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden bg-[#fdfdfb] shadow-2xl rounded-lg"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d7d2c8] px-6 py-4">
          <h2 className="font-serif text-2xl italic text-black">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-[#5f5e5e] transition hover:bg-[#f0ede6] hover:text-black"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#d7d2c8]">
          {TABS.map((tab) => {
            const isDisabled = tab.key === 'inventory' && !editingProductId;
            return (
              <button
                key={tab.key}
                onClick={() => !isDisabled && setActiveTab(tab.key)}
                disabled={isDisabled}
                className={`flex items-center gap-2 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  activeTab === tab.key
                    ? 'border-b-2 border-black text-black'
                    : isDisabled
                      ? 'cursor-not-allowed text-[#c4c0b8]'
                      : 'text-[#777777] hover:text-black'
                }`}
                title={isDisabled ? 'Lưu sản phẩm trước để quản lý phân loại kho' : ''}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'general' && (
            <form className="space-y-4" onSubmit={handleSubmitGeneral}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                
                {/* Cột trái: Ảnh và Trạng thái */}
                <div className="space-y-6 lg:col-span-4 flex flex-col">
                  <ImageGalleryUploadField
                    key={editingProductId || 'new-product'}
                    label="Ảnh sản phẩm"
                    value={productForm.imageUrls}
                    onChange={onProductImagesChange}
                    onUploadStateChange={setImageUploadState}
                    disabled={isSavingProduct}
                  />
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                      Trạng thái hiển thị
                    </span>
                    <select
                      name="status"
                      value={productForm.status}
                      onChange={onProductFieldChange}
                      className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="DISCONTINUED">DISCONTINUED</option>
                    </select>
                  </label>
                </div>

                {/* Cột phải: Thông tin văn bản */}
                <div className="space-y-5 lg:col-span-8 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminField label="Tên sản phẩm" name="name" value={productForm.name} onChange={onProductFieldChange} />
                    <AdminField label="Slug (tự động tạo)" name="slug" value={productForm.slug} onChange={onProductFieldChange} required={false} />
                  </div>
                  
                  <AdminField label="Mô tả" name="description" value={productForm.description} onChange={onProductFieldChange} multiline required={false} />

                  <div className="grid grid-cols-2 gap-3">
                    <AdminField label="Giá thuê" name="rentalPrice" type="currency" value={productForm.rentalPrice} onChange={onProductFieldChange} />
                    <AdminField label="Giá trị gốc của áo (để tính cọc)" name="depositPrice" type="currency" value={productForm.depositPrice} onChange={onProductFieldChange} />
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                      Danh mục
                    </span>
                    <SearchableSelect
                      name="categoryId"
                      value={productForm.categoryId}
                      onChange={onProductFieldChange}
                      options={categories}
                      placeholder="Chọn danh mục"
                      disableNonLeafOptions={true}
                    />
                  </label>

                  {/* Metadata section */}
                  <div className="border border-[#ebe7df] bg-[#fafaf8] p-4">
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">Metadata sản phẩm</p>
                      <p className="mt-1 text-xs text-[#5f5e5e]">
                        Các trường style, occasion, season, color, tags là bắt buộc cho thông tin catalog sản phẩm.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                      <AdminField label="Phong cách *" name="style" value={productForm.style} onChange={onProductFieldChange} required />
                      <AdminField label="Dịp sử dụng *" name="occasion" value={productForm.occasion} onChange={onProductFieldChange} required />
                      <AdminField label="Mùa *" name="season" value={productForm.season} onChange={onProductFieldChange} required />
                      <AdminField label="Màu sắc *" name="color" value={productForm.color} onChange={onProductFieldChange} required />
                      <AdminField label="Từ khóa *" name="tags" value={productForm.tags} onChange={onProductFieldChange} required />
                      <AdminField label="Tông da" name="skinTone" value={productForm.skinTone} onChange={onProductFieldChange} required={false} />
                      <AdminField label="Dáng người" name="bodyType" value={productForm.bodyType} onChange={onProductFieldChange} required={false} />
                      <AdminField label="Giới tính" name="gender" value={productForm.gender} onChange={onProductFieldChange} required={false} />
                      <AdminField label="Size gợi ý" name="size" value={productForm.size} onChange={onProductFieldChange} required={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <AdminField label="Chất liệu" name="material" value={productForm.material} onChange={onProductFieldChange} required={false} />
                      <AdminField label="Ghi chú form dáng" name="fitNote" value={productForm.fitNote} onChange={onProductFieldChange} multiline required={false} />
                    </div>
                  </div>
                </div>

              </div>

              {productMessage && <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{productMessage}</p>}
              {productError && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{productError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  disabled={isSavingProduct || imageUploadState.isUploading || Boolean(imageUploadState.error)}
                  className="flex-1 bg-black py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
                >
                  {imageUploadState.isUploading
                    ? 'Đang tải ảnh...'
                    : isSavingProduct
                      ? 'Đang lưu...'
                      : editingProductId
                        ? 'Cập nhật sản phẩm'
                        : 'Đăng tải sản phẩm'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-[#d7d2c8] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Add/Edit item form */}
              <div className="border border-[#ebe7df] bg-[#fafaf8] p-4">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
                  {editingItemId ? 'Sửa phân loại' : 'Thêm phân loại mới'}
                </p>
                {/* Row 1: Size + Color (smart inputs) */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Size *</span>
                    <input
                      name="size"
                      value={itemForm.size}
                      onChange={handleItemFieldChange}
                      list="size-suggestions"
                      placeholder="Chọn hoặc nhập tùy chỉnh"
                      autoComplete="off"
                      className="w-full border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7f7041]"
                    />
                    <datalist id="size-suggestions">
                      {SIZE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Màu *</span>
                    <input
                      name="color"
                      value={itemForm.color}
                      onChange={handleItemFieldChange}
                      list="color-suggestions"
                      placeholder="Chọn hoặc nhập tùy chỉnh"
                      autoComplete="off"
                      className="w-full border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7f7041]"
                    />
                    <datalist id="color-suggestions">
                      {COLOR_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </label>
                </div>

                {/* Row 2: SKU (auto-generated) + Status */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
                      SKU
                      {!editingItemId && !skuManuallyEdited && itemForm.sku && (
                        <span className="inline-flex items-center gap-0.5 rounded-sm bg-[#e8f5e9] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-green-700">
                          <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                          Tự động
                        </span>
                      )}
                    </span>
                    <input
                      name="sku"
                      value={itemForm.sku}
                      onChange={handleItemFieldChange}
                      placeholder={itemForm.size && itemForm.color ? 'Đang tự tạo...' : 'Chọn Size và Màu trước'}
                      className={`w-full border px-3 py-2.5 text-sm outline-none focus:border-[#7f7041] ${
                        !editingItemId && !skuManuallyEdited && itemForm.sku
                          ? 'border-green-200 bg-green-50/50 font-mono text-green-800'
                          : 'border-[#d7d2c8] bg-white'
                      }`}
                    />
                    {!editingItemId && (
                      <p className="mt-1 text-[9px] text-[#999999]">
                        {skuManuallyEdited
                          ? 'SKU thủ công — '
                          : 'Tự động tạo từ Tên + Size + Màu — '}
                        <button
                          type="button"
                          onClick={handleRegenerateSku}
                          className="text-[#7f7041] underline hover:text-black"
                        >
                          Tạo lại
                        </button>
                      </p>
                    )}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Trạng thái</span>
                    <select
                      name="status"
                      value={itemForm.status}
                      onChange={handleItemFieldChange}
                      className="w-full border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7f7041]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveItem}
                    disabled={isSavingItem || !itemForm.sku || !itemForm.size || !itemForm.color}
                    className="flex items-center gap-1.5 bg-black px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#7f7041] disabled:bg-[#999999]"
                  >
                    <span className="material-symbols-outlined text-[14px]">{editingItemId ? 'save' : 'add'}</span>
                    {isSavingItem ? 'Đang lưu...' : editingItemId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={handleCancelEditItem}
                      className="border border-[#d7d2c8] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e] transition hover:border-black hover:text-black"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>
              </div>

              {/* Items list */}
              {isLoadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-[28px] text-[#7f7041]">progress_activity</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-[#d7d2c8]">inventory_2</span>
                  <p className="text-sm text-[#5f5e5e]">Chưa có phân loại kho nào. Hãy thêm mới ở form bên trên.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      <tr>
                        <th className="px-4 py-2.5">SKU</th>
                        <th className="px-4 py-2.5">Size</th>
                        <th className="px-4 py-2.5">Màu</th>
                        <th className="px-4 py-2.5">Trạng thái</th>
                        <th className="px-4 py-2.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                      {items.map((item) => (
                        <tr key={item.id} className="transition hover:bg-[#f5f2eb]">
                          <td className="px-4 py-2.5">
                            <code className="bg-[#eeeeee] px-1.5 py-0.5 text-[11px]">{item.sku}</code>
                          </td>
                          <td className="px-4 py-2.5 font-medium">{item.size}</td>
                          <td className="px-4 py-2.5">{item.color}</td>
                          <td className="px-4 py-2.5">{statusBadge(item.status)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditItem(item)}
                                className="inline-flex items-center gap-1 border border-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition hover:bg-black hover:text-white"
                              >
                                <span className="material-symbols-outlined text-[12px]">edit</span>
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={item.status === 'RENTED'}
                                className="inline-flex items-center gap-1 border border-red-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-[#d7d2c8] disabled:text-[#c4c0b8] disabled:hover:bg-transparent"
                                title={item.status === 'RENTED' ? 'Không thể xóa item đang được thuê' : ''}
                              >
                                <span className="material-symbols-outlined text-[12px]">delete</span>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
