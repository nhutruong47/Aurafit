// Khu vuc san pham noi bat theo tab tren trang chu.
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { featuredTabs } from './homeData';

function ProductCard({ product, onAddToCart, onNavigate }) {
  return (
    <article className="group cursor-pointer" onClick={() => onNavigate?.('productDetail', product)}>
      <div className="relative mb-6 aspect-[3/4] overflow-hidden border border-[#cfc4c5]/20 bg-white transition duration-500 group-hover:border-[#99854e]/40">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover grayscale-[0.4] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/10" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(toCartItem(product));
          }}
          className="absolute bottom-6 left-1/2 w-[80%] -translate-x-1/2 bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition duration-500 hover:bg-[#99854e] group-hover:opacity-100"
        >
          Thêm vào giỏ
        </button>
      </div>
      <div className="text-center">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition group-hover:text-[#99854e]">
          {product.name}
        </h3>
        <p className="mb-3 text-xs italic text-[#4c4546]">{product.meta}</p>
        <span className="font-serif text-3xl text-black">{product.price}</span>
      </div>
    </article>
  );
}

export default function HomeFeaturedSection({
  activeTab,
  isLoading,
  products,
  onSetActiveTab,
  onAddToCart,
  onNavigate,
}) {
  return (
    <section className="bg-[#f7f7f7] py-24 md:py-[120px]" id="featured">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 flex flex-col items-baseline justify-between gap-10 md:flex-row">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Bộ sưu tập</p>
            <h2 className="font-serif text-4xl font-normal md:text-5xl">Sản phẩm nổi bật</h2>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-8">
            {featuredTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onSetActiveTab(tab.key)}
                className={`pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                  activeTab === tab.key
                    ? 'border-b border-black text-black'
                    : 'text-[#4c4546] hover:text-[#99854e]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm italic text-[#5f5e5e]">Đang tải sản phẩm...</p>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {products[activeTab].map((product) => (
              <ProductCard
                key={product.id || product.name}
                product={product}
                onAddToCart={onAddToCart}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}

        <div className="mt-20 flex justify-center">
          <button
            onClick={() => onNavigate?.('catalog')}
            className="group flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:text-[#99854e]"
          >
            <span>Khám phá toàn bộ bộ sưu tập</span>
            <span className="material-symbols-outlined text-[16px]">east</span>
          </button>
        </div>
      </div>
    </section>
  );
}
