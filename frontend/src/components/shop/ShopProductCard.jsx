// Editorial Product Card — Luxury/Minimal aesthetic.
// Only shows image, category, name, price, deposit, and a single "Xem chi tiết" CTA.
import { fallbackProductImage } from '../../utils/productMapper';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ShopProductCard({ product, onNavigate }) {
  const discountPercentage = product.discountPercentage || 0;
  let salePrice = product.priceValue;
  if (discountPercentage > 0) {
    salePrice = Math.round(product.priceValue * (1 - discountPercentage / 100));
  }

  const available = product.available;

  return (
    <article className="group flex flex-col border border-[#cfc4c5] bg-white transition hover:border-[#99854e]">
      {/* Image */}
      <div
        onClick={() => onNavigate?.('productDetail', product)}
        className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[#eeeeee]"
      >
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => { e.currentTarget.src = fallbackProductImage; }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        {discountPercentage > 0 && (
          <span className="absolute left-3 top-3 z-10 bg-[#ba1a1a] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            -{discountPercentage}%
          </span>
        )}
        <span className={`absolute ${discountPercentage > 0 ? 'left-3 top-10' : 'left-3 top-3'} z-10 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}>
          {product.category}
        </span>
        <span className={`absolute right-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
          available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {available ? 'Còn hàng' : 'Tạm hết'}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div onClick={() => onNavigate?.('productDetail', product)} className="cursor-pointer">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
            {product.subcategory || product.rawCategory}{product.tag ? ` · ${product.tag}` : ''}
          </p>
          <h3 className="line-clamp-2 min-h-[44px] font-serif text-xl italic leading-tight transition group-hover:text-[#99854e]">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e8e4e3] pt-3 text-sm">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Giá thuê</p>
            <p className="mt-0.5 font-medium">
              {discountPercentage > 0 ? (
                <>
                  <span className="mr-1.5 text-[#999999] line-through text-xs">{formatCurrency(product.priceValue)}</span>
                  <span className="text-[#ba1a1a]">{formatCurrency(salePrice)}</span>
                </>
              ) : (
                formatCurrency(product.priceValue)
              )}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Tiền cọc</p>
            <p className="mt-0.5 font-medium">{formatCurrency(product.depositValue)}</p>
          </div>
        </div>

        {/* Single CTA */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => onNavigate?.('productDetail', product)}
            className="w-full border border-black px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}
