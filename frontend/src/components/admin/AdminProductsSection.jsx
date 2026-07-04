import { formatCurrency } from '../../utils/formatCurrency';
import ImageUploadField from '../ui/ImageUploadField';
import { AdminField, Panel } from './AdminDashboardShared';

export default function AdminProductsSection({
  products,
  categories,
  sellerUsers = [],
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
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[460px_1fr]">
      <Panel title={editingProductId ? 'Sửa sản phẩm' : 'Đăng sản phẩm'}>
        <form className="space-y-4" onSubmit={onSubmitProduct}>
          <AdminField label="Tên sản phẩm" name="name" value={productForm.name} onChange={onProductFieldChange} />
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

          {isAdmin && (
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                Seller owner
              </span>
              <select
                name="ownerUserId"
                value={productForm.ownerUserId}
                onChange={onProductFieldChange}
                required
                className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
              >
                <option value="">Chon tai khoan SELLER</option>
                {sellerUsers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.fullName || seller.email} ({seller.email})
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                Danh mục
              </span>
              <select
                name="categoryId"
                value={productForm.categoryId}
                onChange={onProductFieldChange}
                className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.path || category.name}
                  </option>
                ))}
              </select>
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

          <div className="border border-[#ebe7df] bg-[#fafaf8] p-4">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">Metadata gợi ý</p>
              <p className="mt-2 text-sm text-[#5f5e5e]">
                Các trường `style`, `occasion`, `season`, `color`, `tags` là bắt buộc để làm nền tảng cho gợi ý sản phẩm tương tự
                và gợi ý cá nhân hóa ở trang chủ.
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

          <button
            disabled={isSavingProduct}
            className="w-full bg-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
          >
            {isSavingProduct ? 'Đang lưu...' : editingProductId ? 'Cập nhật sản phẩm' : 'Đăng tải sản phẩm'}
          </button>
          {editingProductId && (
            <button
              type="button"
              onClick={onResetProductForm}
              className="w-full border border-[#d7d2c8] py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Hủy sửa
            </button>
          )}
        </form>
      </Panel>

      <Panel title="Kho sản phẩm" action={`${filteredProducts.length}/${products.length} sản phẩm`}>
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_160px]">
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
          <select
            value={productCategoryFilter}
            onChange={(event) => onProductCategoryFilterChange(event.target.value)}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.path}>
                {category.path || category.name}
              </option>
            ))}
          </select>
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredProducts.slice(0, 24).map((product) => (
            <article key={product.id} className="grid grid-cols-[88px_1fr] gap-4 border border-[#ebe7df] bg-[#fafaf8] p-3">
              <div className="aspect-[3/4] overflow-hidden bg-[#eeeeee]">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#999999]">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
                  {product.category?.name || 'Trang phục'}
                </p>
                <h3 className="mt-1 line-clamp-2 font-serif text-xl italic">{product.name}</h3>
                <p className="mt-2 text-xs text-[#5f5e5e]">
                  Giá thuê: <strong>{formatCurrency(product.rentalPrice || 0)}</strong>
                </p>
                <p className="mt-1 text-xs text-[#5f5e5e]">
                  Trạng thái: <strong>{product.status === 'ACTIVE' ? 'Đang hiển thị' : product.status}</strong>
                </p>
                {product.owner && (
                  <p className="mt-1 truncate text-xs text-[#5f5e5e]">
                    Seller owner: <strong>{product.owner.fullName || product.owner.email}</strong>
                  </p>
                )}
                {product.metadata?.style && (
                  <p className="mt-1 text-xs text-[#5f5e5e]">
                    Metadata: <strong>{[product.metadata.style, product.metadata.occasion, product.metadata.season].filter(Boolean).join(' • ')}</strong>
                  </p>
                )}
                <button
                  onClick={() => onEditProduct(product)}
                  className="mt-3 border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
                >
                  Sửa sản phẩm
                </button>
              </div>
            </article>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <p className="border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">
            Không có sản phẩm nào khớp bộ lọc hiện tại.
          </p>
        )}
      </Panel>
    </section>
  );
}
