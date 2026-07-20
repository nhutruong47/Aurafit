import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import AdminCostumeModal from './AdminCostumeModal';
import SearchableSelect from '../ui/SearchableSelect';
import { Panel } from './AdminDashboardShared';
import Pagination from './Pagination';

export default function AdminProductsSection({
  categories,
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
  onProductImagesChange,
  onEditProduct,
  onResetProductForm,
  onSubmitProduct,
  page,
  totalPages,
  totalElements,
  setPage,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCreate = () => {
    onResetProductForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    onEditProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onResetProductForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await onSubmitProduct(event);
    if (success) {
      setTimeout(() => setIsModalOpen(false), 300);
    }
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
                    <th className="px-4 py-3 w-[80px] text-center">Kho</th>
                    <th className="px-4 py-3">Metadata</th>
                    <th className="px-4 py-3 w-[100px]">Trạng thái</th>
                    <th className="px-4 py-3 w-[80px] text-right">Sửa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-[#f5f2eb] cursor-pointer" onClick={() => handleOpenEdit(product)}>
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
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex h-6 min-w-[24px] items-center justify-center px-1 text-[11px] font-bold ${
                          product.availableItemCount > 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-[#f4f4f2] text-[#999999]'
                        }`}>
                          {product.availableItemCount ?? 0}
                        </span>
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
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(product); }}
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

      {/* Centered Modal for Create/Edit */}
      <AdminCostumeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProductId ? 'Sửa sản phẩm' : 'Đăng sản phẩm mới'}
        editingProductId={editingProductId}
        productForm={productForm}
        onProductFieldChange={onProductFieldChange}
        onProductImagesChange={onProductImagesChange}
        onSubmitProduct={handleSubmit}
        isSavingProduct={isSavingProduct}
        productMessage={productMessage}
        productError={productError}
        categories={categories}
      />
    </>
  );
}
