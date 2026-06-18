// Slider concept phong cach de dieu huong sang bo suu tap lien quan.
import { styleCategories } from './homeData';

const routeMap = {
  'Sự kiện': 'events',
  Cosplay: 'cosplay',
  'Kỷ yếu': 'yearbook',
  'Phụ kiện': 'catalog',
  Concept: 'catalog',
};

export default function HomeStyleSlider({ sliderRef, onNavigate, onScroll }) {
  return (
    <section className="overflow-hidden bg-white py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">
              Danh mục tuyển chọn
            </p>
            <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Khám phá phong cách</h2>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => onScroll('left')}
              className="flex h-12 w-12 items-center justify-center border border-[#cfc4c5]/40 transition hover:bg-[#99854e] hover:text-white"
              aria-label="Cuộn trái"
            >
              <span className="material-symbols-outlined">west</span>
            </button>
            <button
              onClick={() => onScroll('right')}
              className="flex h-12 w-12 items-center justify-center border border-[#cfc4c5]/40 transition hover:bg-[#99854e] hover:text-white"
              aria-label="Cuộn phải"
            >
              <span className="material-symbols-outlined">east</span>
            </button>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth pb-10"
        >
          {styleCategories.map((category) => (
            <article
              key={category.title}
              onClick={() => onNavigate?.(routeMap[category.title] || 'catalog')}
              className="group relative aspect-[4/5] min-w-[85%] flex-shrink-0 snap-center cursor-pointer overflow-hidden bg-black md:min-w-[45%] lg:min-w-[30%]"
            >
              <img
                src={category.image}
                alt={category.title}
                className="h-full w-full object-cover opacity-80 transition duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-8 right-8 md:left-10 md:right-10">
                <h3 className="mb-4 font-serif text-4xl italic text-white">{category.title}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">{category.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
