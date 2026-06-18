// The san pham trong danh sach Shop.
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ShopProductCard({ product, onNavigate, onAddToCart }) {
  return (
    <article
      onClick={() => onNavigate?.('productDetail', product)}
      className="group cursor-pointer border border-[#cfc4c5] bg-white transition hover:border-[#99854e]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#eeeeee]">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          {product.category}
        </span>
        <span
          className={`absolute right-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {product.available ? 'Còn hàng' : 'Tạm hết'}
        </span>
      </div>
      <div className="p-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
          {product.subcategory || product.rawCategory} {product.tag ? `| ${product.tag}` : ''}
        </p>
        <h3 className="line-clamp-2 min-h-[48px] font-serif text-2xl italic leading-tight transition group-hover:text-[#99854e]">
          {product.name}
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Giá thuê</p>
            <p className="mt-1 font-medium">{formatCurrency(product.priceValue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Tiền cọc</p>
            <p className="mt-1 font-medium">{formatCurrency(product.depositValue)}</p>
          </div>
        </div>
        <button
          disabled={!product.available}
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart?.(toCartItem(product));
          }}
          className={`mt-5 w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
            product.available
              ? 'bg-black text-white hover:bg-[#99854e]'
              : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
          }`}
        >
          Thuê ngay
        </button>
      </div>
    </article>
  );
}
