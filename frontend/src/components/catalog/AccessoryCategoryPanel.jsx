import {
  getCostumeDisplayCategory,
  getCostumePrice,
  getCostumeSubcategory,
} from '../../utils/costumeUtils';

export default function AccessoryCategoryPanel({
  eyebrow = 'Phụ kiện',
  title,
  description,
  categories,
  products = [],
  onNavigate,
  emptyLabel = 'Chưa có nhánh phụ kiện phù hợp trong dữ liệu hiện tại.',
}) {
  return (
    <div className="border border-[#cfc4c5] bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">{eyebrow}</p>
      {title && <p className="mt-3 font-serif text-3xl italic leading-tight">{title}</p>}
      {description && <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">{description}</p>}

      {products.length > 0 && (
        <div className="mt-5 space-y-3 border-b border-[#e8e4e3] pb-5">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onNavigate?.('productDetail', product)}
              className="block w-full border border-[#e8e4e3] px-4 py-3 text-left transition hover:border-black"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#99854e]">
                {getCostumeSubcategory(product) || getCostumeDisplayCategory(product)}
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-black">{product.name}</p>
              <p className="mt-1 text-sm text-[#5f5e5e]">{getCostumePrice(product)}</p>
            </button>
          ))}
        </div>
      )}

      {categories.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.path}
              onClick={() => onNavigate?.('catalog', { categoryPath: category.path })}
              className="border border-[#cfc4c5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[#5f5e5e]">{emptyLabel}</p>
      )}
    </div>
  );
}
