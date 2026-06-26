import { formatCurrency } from '../../utils/formatCurrency';
import ImageUploadField from '../ui/ImageUploadField';
import { AdminField, Panel } from './AdminDashboardShared';

export default function AdminProductsSection({
  products,
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
  onProductImageUploaded,
  onEditProduct,
  onResetProductForm,
  onSubmitProduct,
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[460px_1fr]">
      <Panel title={editingProductId ? 'Sua san pham' : 'Dang san pham'}>
        <form className="space-y-4" onSubmit={onSubmitProduct}>
          <AdminField label="Ten san pham" name="name" value={productForm.name} onChange={onProductFieldChange} />
          <AdminField
            label="Mo ta"
            name="description"
            value={productForm.description}
            onChange={onProductFieldChange}
            multiline
            required={false}
          />
          <ImageUploadField
            key={editingProductId || 'new-product'}
            label="Anh san pham"
            value={productForm.imageUrl}
            onUploaded={onProductImageUploaded}
          />

          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Gia thue" name="rentalPrice" type="number" value={productForm.rentalPrice} onChange={onProductFieldChange} />
            <AdminField label="Tien coc" name="depositPrice" type="number" value={productForm.depositPrice} onChange={onProductFieldChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                Danh muc
              </span>
              <select
                name="categoryId"
                value={productForm.categoryId}
                onChange={onProductFieldChange}
                className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                Trang thai hien thi
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">Metadata recommendation</p>
              <p className="mt-2 text-sm text-[#5f5e5e]">
                Cac truong `style`, `occasion`, `season`, `color`, `tags` la bat buoc de lam nen tang cho similar products
                va personalized homepage.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AdminField label="Style *" name="style" value={productForm.style} onChange={onProductFieldChange} required />
              <AdminField label="Occasion *" name="occasion" value={productForm.occasion} onChange={onProductFieldChange} required />
              <AdminField label="Season *" name="season" value={productForm.season} onChange={onProductFieldChange} required />
              <AdminField label="Color *" name="color" value={productForm.color} onChange={onProductFieldChange} required />
              <AdminField label="Tags *" name="tags" value={productForm.tags} onChange={onProductFieldChange} required />
              <AdminField label="Skin tone" name="skinTone" value={productForm.skinTone} onChange={onProductFieldChange} required={false} />
              <AdminField label="Body type" name="bodyType" value={productForm.bodyType} onChange={onProductFieldChange} required={false} />
              <AdminField label="Gender" name="gender" value={productForm.gender} onChange={onProductFieldChange} required={false} />
              <AdminField label="Size goi y" name="size" value={productForm.size} onChange={onProductFieldChange} required={false} />
              <AdminField label="Material" name="material" value={productForm.material} onChange={onProductFieldChange} required={false} />
            </div>

            <div className="mt-3">
              <AdminField
                label="Fit note"
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
            {isSavingProduct ? 'Dang luu...' : editingProductId ? 'Cap nhat san pham' : 'Dang tai san pham'}
          </button>
          {editingProductId && (
            <button
              type="button"
              onClick={onResetProductForm}
              className="w-full border border-[#d7d2c8] py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Huy sua
            </button>
          )}
        </form>
      </Panel>

      <Panel title="Kho san pham" action={`${filteredProducts.length}/${products.length} san pham`}>
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_160px]">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
              search
            </span>
            <input
              value={productSearch}
              onChange={(event) => onProductSearchChange(event.target.value)}
              placeholder="Tim theo ten, mo ta, metadata..."
              className="w-full border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
          <select
            value={productCategoryFilter}
            onChange={(event) => onProductCategoryFilterChange(event.target.value)}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          >
            <option value="all">Tat ca danh muc</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={productStatusFilter}
            onChange={(event) => onProductStatusFilterChange(event.target.value)}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          >
            <option value="all">Tat ca trang thai</option>
            <option value="available">Dang hien thi</option>
            <option value="hidden">Tam an</option>
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
                  {product.category?.name || 'Trang phuc'}
                </p>
                <h3 className="mt-1 line-clamp-2 font-serif text-xl italic">{product.name}</h3>
                <p className="mt-2 text-xs text-[#5f5e5e]">
                  Gia thue: <strong>{formatCurrency(product.rentalPrice || 0)}</strong>
                </p>
                <p className="mt-1 text-xs text-[#5f5e5e]">
                  Trang thai: <strong>{product.status === 'ACTIVE' ? 'Dang hien thi' : product.status}</strong>
                </p>
                {product.metadata?.style && (
                  <p className="mt-1 text-xs text-[#5f5e5e]">
                    Metadata: <strong>{[product.metadata.style, product.metadata.occasion, product.metadata.season].filter(Boolean).join(' • ')}</strong>
                  </p>
                )}
                <button
                  onClick={() => onEditProduct(product)}
                  className="mt-3 border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
                >
                  Sua san pham
                </button>
              </div>
            </article>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <p className="border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">
            Khong co san pham nao khop bo loc hien tai.
          </p>
        )}
      </Panel>
    </section>
  );
}
