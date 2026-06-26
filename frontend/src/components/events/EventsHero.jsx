// Hero section mo dau cho trang Events.
export default function EventsHero({ onNavigate }) {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-12 md:grid-cols-12 md:px-20 md:py-16">
      <div className="md:col-span-5">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Trang phục sự kiện</p>
        <h1 className="font-serif text-[48px] font-normal italic leading-[1.12] md:text-[78px]">
          Trang phục cho mọi khoảnh khắc lớn.
        </h1>
        <p className="mt-7 max-w-xl text-base leading-8 text-[#5f5e5e]">
          Từ gala, tiệc cưới, prom đến thảm đỏ, AuraFit tuyển chọn những outfit có form dáng rõ, lên hình đẹp
          và dễ hoàn thiện bằng phụ kiện.
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
            Hỏi AI stylist
          </button>
        </div>
      </div>

      <div className="md:col-span-7">
        <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <div className="hidden overflow-hidden bg-[#eeeeee] md:block">
            <img
              src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=85"
              alt="Không gian sự kiện cao cấp"
              className="h-full min-h-[520px] w-full object-cover grayscale-[0.35]"
            />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-black md:aspect-auto">
            <img
              src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1100&q=85"
              alt="Đầm dạ hội cho sự kiện"
              className="h-full w-full object-cover opacity-90 transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-7 text-white md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">Sẵn sàng trong 24h</p>
              <p className="mt-3 font-serif text-3xl italic leading-tight md:text-5xl">Gala, tiệc cưới, prom</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
