import { formatCurrency } from '../../utils/formatCurrency';
import {
  fallbackCostumeImage,
  getCostumeApiCategoryName,
  getCostumeDepositPriceValue,
  getCostumeDiscountPercentValue,
  getCostumeDisplayCategory,
  getCostumeFinalPriceValue,
  getCostumeImage,
  getCostumeRentalPriceValue,
  getCostumeSubcategory,
  getCostumeTag,
  hasCostumeDiscount,
  isCostumeAvailable,
} from '../../utils/costumeUtils';

export default function CatalogProductCard({ costume, product, onNavigate }) {
  const item = product || costume;
  const categoryLabel = getCostumeDisplayCategory(item);
  const subcategoryLabel = getCostumeSubcategory(item) || getCostumeApiCategoryName(item);
  const available = isCostumeAvailable(item);
  const tag = getCostumeTag(item);
  const discounted = hasCostumeDiscount(item);
  const discountPercent = getCostumeDiscountPercentValue(item);
  const finalPrice = getCostumeFinalPriceValue(item);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#ded2c6] bg-[#fffdfa] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#9a7745]/60 hover:shadow-md">
      <div
        onClick={() => onNavigate?.('productDetail', item)}
        className="relative aspect-[4/3] cursor-pointer overflow-hidden"
      >
        <img
          src={getCostumeImage(item)}
          alt={item.name}
          onError={(event) => {
            event.currentTarget.src = fallbackCostumeImage;
          }}
          className="h-full w-full object-contain"
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          <span className="rounded-full border border-white/20 bg-[#2f251f]/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {categoryLabel}
          </span>
          {tag && (
            <span className="rounded-sm border border-white/20 bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur-md">
              {tag}
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              available
                ? 'border-[#8bc2bd]/50 bg-[#3f7c78]/75 text-white'
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

      <div className="flex min-h-[248px] flex-1 flex-col gap-4 p-5">
        <div onClick={() => onNavigate?.('productDetail', item)} className="cursor-pointer">
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-[#2f251f] transition-colors duration-300 group-hover:text-[#3f7c78]">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] text-[#81746a]">
            {subcategoryLabel || categoryLabel}
            {tag ? ` • ${tag}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-[#eee6dc] py-4">
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[#9b9087]">Giá thuê</span>
            {discounted ? (
              <div className="space-y-1">
                <span className="block text-xs text-[#81746a] line-through">
                  {formatCurrency(getCostumeRentalPriceValue(item))}
                </span>
                <span className="block font-serif text-xl text-[#9a7745]">{formatCurrency(finalPrice)}</span>
              </div>
            ) : (
              <span className="font-serif text-xl text-[#2f251f]">
                {formatCurrency(getCostumeRentalPriceValue(item))}
              </span>
            )}
          </div>
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[#9b9087]">Tiền cọc</span>
            <span className="font-serif text-xl text-[#2f251f]">
              {formatCurrency(getCostumeDepositPriceValue(item))}
            </span>
          </div>
        </div>

        <div className="min-h-7">
          {discounted && (
            <div className="inline-flex w-fit rounded-sm border border-[#c8b378] bg-[#fbf7e8] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#7f7041]">
              {item.eventName ? `${item.eventName} · ` : ''}Giảm {discountPercent}%
            </div>
          )}
        </div>

        <div className="mt-auto">
          <button
            onClick={() => onNavigate?.('productDetail', item)}
            className="w-full rounded-md border border-[#4d3830] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4d3830] transition-all duration-300 hover:bg-[#4d3830] hover:text-white"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}
