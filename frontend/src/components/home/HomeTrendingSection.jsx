// Khu vuc san pham dang thinh hanh tren trang chu.
import { fallbackProductImage } from '../../utils/productMapper';

export default function HomeTrendingSection({ trending, onNavigate }) {
  return (
    <section className="bg-[#f7f7f7] py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 flex items-end justify-between gap-8">
          <h2 className="font-serif text-4xl font-normal md:text-5xl">Trending This Week</h2>
          <a className="border-b border-[#99854e] pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]" href="#featured">
            View All
          </a>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((item) => (
            <article key={item.id || item.name} className="group cursor-pointer" onClick={() => onNavigate?.('productDetail', item)}>
              <div className="mb-6 aspect-square overflow-hidden border border-[#cfc4c5]/20 bg-white">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.src = fallbackProductImage;
                  }}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{item.name}</h3>
              <p className="font-serif text-2xl text-[#99854e]">{item.price}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
