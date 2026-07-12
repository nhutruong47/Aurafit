import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import AdminDrawer from './AdminDrawer';
import ImageUploadField from '../ui/ImageUploadField';
import { AdminField, Panel } from './AdminDashboardShared';
import Pagination from './Pagination';
import SearchableSelect from '../ui/SearchableSelect';

export default function AdminProductsSection({
  products,
  categories,
  isAdmin = false,
  filteredProducts,
  productForm,
  editingProductId,
  productSearch,
  productCategoryFilter,
  productStatusFilter,
  productMessage,
  productError,
  isSavingProduct,
  onProductSearchChange,
  onProductCategoryFilterChange,
  onProductStatusFilterChange,
  onProductFieldChange,
  onProductImageUploaded,
  onEditProduct,
  onResetProductForm,
  onSubmitProduct,
  page,
  totalPages,
  totalElements,
  setPage,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenCreate = () => {
    onResetProductForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product) => {
    onEditProduct(product);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    onResetProductForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmitProduct(event);
    setTimeout(() => setIsDrawerOpen(false), 200);
  };

  return (
    <>
      {/* Full-width data view */}
      <Panel
        title="Quản lý sản phẩm"
        action={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Đăng sản phẩm
          </button>
        }
      >
        {/* Filter bar */}
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_200px_160px]">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
              search
            </span>
            <input
              value={productSearch}
              onChange={(event) => onProductSearchChange(event.target.value)}
              placeholder="Tìm theo tên, mô tả, metadata..."
              className="w-full border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
          <SearchableSelect
            name="productCategoryFilter"
            value={productCategoryFilter}
            onChange={(event) => onProductCategoryFilterChange(event.target.value)}
            options={[
              { id: 'all', name: 'Tất cả danh mục' },
              ...categories
            ]}
          />
          <select
            value={productStatusFilter}
            onChange={(event) => onProductStatusFilterChange(event.target.value)}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Đang hiển thị</option>
            <option value="hidden">Tạm ẩn</option>
          </select>
        </div>

        {/* Product table */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#d7d2c8]">inventory_2</span>
            <p className="text-sm text-[#5f5e5e]">Không có sản phẩm nào khớp bộ lọc hiện tại.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  <tr>
                    <th className="px-4 py-3 w-[72px]">Ảnh</th>
                    <th className="px-4 py-3">Tên sản phẩm</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Giá thuê</th>
                    <th className="px-4 py-3">Metadata</th>
                    <th className="px-4 py-3 w-[100px]">Trạng thái</th>
                    <th className="px-4 py-3 w-[80px] text-right">Sửa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-[#f5f2eb]">
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 overflow-hidden bg-[#eeeeee]">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#999999]">
                              <span className="material-symbols-outlined text-[18px]">image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-black">{product.name}</p>
                        {product.slug && (
                          <code className="mt-0.5 inline-block bg-[#eeeeee] px-1 text-[10px] text-[#999999]">
                            {product.slug}
                          </code>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5f5e5e]">
                        {product.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {formatCurrency(product.rentalPrice || 0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5f5e5e]">
                        {product.metadata?.style && (
                          <span>
                            {[product.metadata.style, product.metadata.occasion, product.metadata.season]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
                            product.status === 'ACTIVE'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-[#d7d2c8] bg-[#f4f4f2] text-[#999999]'
                          }`}
                        >
                          {product.status === 'ACTIVE' ? 'Hiển thị' : product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="inline-flex items-center gap-1 border border-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
          </>
        )}
      </Panel>

      {/* Slide-out Drawer for Create/Edit form */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingProductId ? 'Sửa sản phẩm' : 'Đăng sản phẩm mới'}
        width="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AdminField label="Tên sản phẩm" name="name" value={productForm.name} onChange={onProductFieldChange} />
          <AdminField label="Slug (tự động tạo)" name="slug" value={productForm.slug} onChange={onProductFieldChange} required={false} />
          <AdminField
            label="Mô tả"
            name="description"
            value={productForm.description}
            onChange={onProductFieldChange}
            multiline
            required={false}
          />
          <ImageUploadField
            key={editingProductId || 'new-product'}
            label="Ảnh sản phẩm"
            value={productForm.imageUrl}
            onUploaded={onProductImageUploaded}
          />

          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Giá thuê" name="rentalPrice" type="number" value={productForm.rentalPrice} onChange={onProductFieldChange} />
            <AdminField label="Tiền cọc" name="depositPrice" type="number" value={productForm.depositPrice} onChange={onProductFieldChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              />
            </label>

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

          {/* Metadata section */}
          <div className="border border-[#ebe7df] bg-[#fafaf8] p-4">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">Metadata gợi ý AI</p>
              <p className="mt-1 text-xs text-[#5f5e5e]">
                Các trường style, occasion, season, color, tags là bắt buộc cho gợi ý sản phẩm.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AdminField label="Phong cách *" name="style" value={productForm.style} onChange={onProductFieldChange} required />
              <AdminField label="Dịp sử dụng *" name="occasion" value={productForm.occasion} onChange={onProductFieldChange} required />
              <AdminField label="Mùa *" name="season" value={productForm.season} onChange={onProductFieldChange} required />
              <AdminField label="Màu sắc *" name="color" value={productForm.color} onChange={onProductFieldChange} required />
              <AdminField label="Từ khóa *" name="tags" value={productForm.tags} onChange={onProductFieldChange} required />
              <AdminField label="Tông da" name="skinTone" value={productForm.skinTone} onChange={onProductFieldChange} required={false} />
              <AdminField label="Dáng người" name="bodyType" value={productForm.bodyType} onChange={onProductFieldChange} required={false} />
              <AdminField label="Giới tính" name="gender" value={productForm.gender} onChange={onProductFieldChange} required={false} />
              <AdminField label="Size gợi ý" name="size" value={productForm.size} onChange={onProductFieldChange} required={false} />
              <AdminField label="Chất liệu" name="material" value={productForm.material} onChange={onProductFieldChange} required={false} />
            </div>

            <div className="mt-3">
              <AdminField
                label="Ghi chú form dáng"
                name="fitNote"
                value={productForm.fitNote}
                onChange={onProductFieldChange}
                multiline
                required={false}
              />
            </div>
          </div>

          {productMessage && <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{productMessage}</p>}
          {productError && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{productError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              disabled={isSavingProduct}
              className="flex-1 bg-black py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
            >
              {isSavingProduct ? 'Đang lưu...' : editingProductId ? 'Cập nhật sản phẩm' : 'Đăng tải sản phẩm'}
            </button>
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="border border-[#d7d2c8] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Hủy
            </button>
          </div>
        </form>
      </AdminDrawer>
    </>
  );
}
