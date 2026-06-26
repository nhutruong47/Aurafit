// The san pham chi tiet trong danh sach Cosplay.
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';

export default function CosplayProductCard({ product, index, onAddToCart }) {
  return (
    <article
      className="group grid overflow-hidden border border-[#cfc4c5] bg-white md:grid-cols-[0.9fr_1.1fr]"
      style={{ animation: `fadeIn 0.7s ease-out ${index * 0.08}s both` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col justify-between p-7">
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Set thuê</p>
          <h3 className="font-serif text-3xl font-normal italic leading-tight">{product.name}</h3>
          <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">{product.meta}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[product.subcategory, product.tag, product.size].filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="border border-[#cfc4c5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-9">
          <p className="mb-5 font-serif text-3xl">{product.price}</p>
          <button
            onClick={() => onAddToCart?.(toCartItem(product))}
            className="w-full bg-black px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e]"
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </article>
  );
}
