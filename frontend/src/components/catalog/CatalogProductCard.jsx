import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackProductImage } from '../../utils/productMapper';

const extractCategoryName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return '';
};

export default function CatalogProductCard({ costume, onNavigate }) {
  const categoryLabel = extractCategoryName(costume.category);
  const subcategoryLabel = extractCategoryName(costume.subcategory);
  const available = costume.available;

  return (
    <article className="group flex flex-col overflow-hidden border border-[#cfc4c5] bg-white transition-all duration-500 hover:border-[#99854e]/50">
      <div onClick={() => onNavigate?.('productDetail', costume)} className="relative h-64 cursor-pointer overflow-hidden">
        <img
          src={costume.image}
          alt={costume.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {categoryLabel}
          </span>
          {costume.tag && (
            <span className="rounded-sm border border-white/20 bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur-md">
              {costume.tag}
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              available
                ? 'border-green-500/30 bg-green-500/20 text-green-100'
                : 'border-red-500/30 bg-red-500/20 text-red-100'
            }`}
          >
            {available ? 'Còn hàng' : 'Hết hàng'}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button className="border border-white/30 bg-white/20 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/30">
            Xem chi tiết
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div onClick={() => onNavigate?.('productDetail', costume)} className="cursor-pointer">
          <h3 className="mb-1 line-clamp-1 text-base font-semibold text-black transition-colors duration-300 group-hover:text-[#99854e]">
            {costume.name}
          </h3>
          <p className="mb-4 line-clamp-1 text-[11px] text-[#777777]">
            {subcategoryLabel || categoryLabel}
            {costume.tag ? ` • ${costume.tag}` : ''}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[#999999]">Giá thuê</span>
            <span className="font-serif text-xl text-black">{formatCurrency(costume.priceValue)}</span>
          </div>
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[#999999]">Tiền cọc</span>
            <span className="font-serif text-xl text-black">{formatCurrency(costume.depositValue)}</span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => onNavigate?.('productDetail', costume)}
            className="w-full border border-black px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition-all duration-300 hover:bg-black hover:text-white"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}
