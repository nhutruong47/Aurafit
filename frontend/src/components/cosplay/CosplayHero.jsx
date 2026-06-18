// Hero section gioi thieu bo suu tap Cosplay.
export default function CosplayHero({ onNavigate }) {
  return (
    <section className="relative min-h-[calc(100dvh-80px)] overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1800&q=85"
        alt="Cosplay editorial scene with dramatic wardrobe"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-80px)] max-w-[1440px] items-end px-5 pb-16 pt-20 md:px-20 md:pb-24">
        <div className="max-w-4xl text-white">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d8c176]">
            Character Rental Studio
          </p>
          <h1 className="font-serif text-[52px] font-normal italic leading-[1.1] md:text-[86px]">
            Bộ sưu tập Cosplay
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/78">
            Trang phục nhân vật được tuyển chọn cho shoot ảnh, event, sân khấu và những concept cần độ hoàn thiện
            cao từ form dáng đến phụ kiện.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById('cosplay-products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#99854e] hover:text-white"
            >
              Thuê trang phục
            </button>
            <button
              onClick={() => onNavigate?.('chat')}
              className="border border-white/70 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[#d8c176] hover:text-[#d8c176]"
            >
              Gửi nhân vật cần tìm
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
