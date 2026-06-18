import { useCostumes } from '../hooks/useCostumes';
import { fallbackProductImage, toCartItem } from '../utils/productMapper';

const occasions = ['Gala', 'Wedding Guest', 'Prom Night', 'Red Carpet'];
const silhouettes = ['Gown', 'Tuxedo', 'Cocktail', 'Suit'];
const rentalWindows = ['4 Days', '8 Days', '12 Days'];

const eventServices = [
  ['event_available', 'Date lock', 'Giữ lịch thuê theo ngày sự kiện và nhắc lịch trả đồ.'],
  ['straighten', 'Fit check', 'Stylist kiểm tra form, chiều dài tà và phụ kiện đi kèm.'],
  ['local_shipping', 'White glove', 'Giao nhận tận nơi cho gala, cưới hỏi và sự kiện tối.'],
];

export default function Events({ onAddToCart, onNavigate }) {
  const { costumes: eventProducts, isLoading, error } = useCostumes('events');

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-12 md:grid-cols-12 md:px-20 md:py-16">
        <div className="md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Event Wardrobe</p>
          <h1 className="font-serif text-[48px] font-normal italic leading-[1.12] md:text-[78px]">
            Trang phục cho mọi khoảnh khắc lớn.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#5f5e5e]">
            Từ gala, tiệc cưới, prom đến red carpet, VIBE tuyển chọn những outfit có form dáng rõ, lên hình đẹp và
            dễ hoàn thiện bằng phụ kiện.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById('event-products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
            >
              Xem sản phẩm
            </button>
            <button
              onClick={() => onNavigate?.('chat')}
              className="border border-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-[#99854e] hover:text-[#99854e]"
            >
              Hỏi stylist AI
            </button>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
            <div className="hidden overflow-hidden bg-[#eeeeee] md:block">
              <img
                src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=85"
                alt="Luxury event interior"
                className="h-full min-h-[520px] w-full object-cover grayscale-[0.35]"
              />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden bg-black md:aspect-auto">
              <img
                src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1100&q=85"
                alt="Evening dress for luxury events"
                className="h-full w-full object-cover opacity-90 transition duration-700 hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-7 text-white md:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">Ready in 24h</p>
                <p className="mt-3 font-serif text-3xl italic leading-tight md:text-5xl">Gala, wedding, prom</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#cfc4c5]/60 bg-white py-10">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 md:grid-cols-3 md:px-20">
          {eventServices.map(([icon, title, copy]) => (
            <article key={title} className="flex gap-4">
              <span className="material-symbols-outlined text-[30px] text-[#99854e]">{icon}</span>
              <div>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="event-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <div className="sticky top-28 space-y-8">
              <FilterGroup title="Dịp thuê" items={occasions} />
              <FilterGroup title="Kiểu dáng" items={silhouettes} />
              <FilterGroup title="Thời gian thuê" items={rentalWindows} />
              <div className="border border-[#cfc4c5] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Event bundle</p>
                <p className="mt-3 font-serif text-3xl italic leading-tight">Thêm phụ kiện để khóa outfit.</p>
                <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
                  Khi thuê một món, giỏ hàng sẽ gợi ý túi, giày, trang sức hoặc khăn phù hợp.
                </p>
              </div>
            </div>
          </aside>

          <div className="md:col-span-9">
            <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#cfc4c5] pb-5 md:flex-row md:items-end">
              <div>
                <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Events Collection</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
                  {isLoading
                    ? 'Đang tải sản phẩm Events từ database...'
                    : `Đang hiển thị ${eventProducts.length} sản phẩm Events từ database.`}
                </p>
                {error && <p className="mt-2 text-sm text-red-600">Chưa kết nối được backend/database.</p>}
              </div>
              <button className="w-fit border border-[#cfc4c5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black">
                Sort by Occasion
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {eventProducts.map((product, index) => (
                <EventCard key={product.name} product={product} index={index} onAddToCart={onAddToCart} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterGroup({ title, items }) {
  return (
    <div className="border-b border-[#cfc4c5] pb-7">
      <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#999999]">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center justify-between gap-4 text-sm text-[#4c4546]">
            <span>{item}</span>
            <input className="h-4 w-4 accent-[#99854e]" type="checkbox" />
          </label>
        ))}
      </div>
    </div>
  );
}

function EventCard({ product, index, onAddToCart }) {
  return (
    <article className="group" style={{ animation: `fadeIn 0.7s ease-out ${index * 0.05}s both` }}>
      <div className="relative mb-5 aspect-[3/4] overflow-hidden bg-[#eeeeee]">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <button
          onClick={() => onAddToCart?.(toCartItem(product))}
          className="absolute inset-x-4 bottom-4 bg-white px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black opacity-0 transition duration-300 hover:bg-[#99854e] hover:text-white group-hover:opacity-100"
        >
          Thêm vào giỏ
        </button>
      </div>
      <p className="mb-2 text-xs italic text-[#777777]">{product.meta}</p>
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] transition group-hover:text-[#99854e]">
        {product.name}
      </h3>
      <p className="mt-3 font-serif text-2xl">{product.price}</p>
    </article>
  );
}
