// Hero section chinh cua trang chu AuraFit.
export default function HomeHero({ onNavigate }) {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover grayscale-[0.3]"
          poster="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=85"
        >
          <source
            src="https://v.ftcdn.net/18/82/86/92/700_F_1882869202_eFgmHxboTuzpA0lJiQvdi1ty0hLLbk6Z_ST.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 py-24 md:px-20">
        <div className="max-w-3xl text-center text-white md:text-left">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#99854e]">
            Trang phục cao cấp cho thuê
          </p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.08] md:text-[72px]">
            Tuyển tập thuê đồ <br /> đậm chất riêng
          </h1>
          <p className="mt-8 max-w-xl text-lg font-light italic leading-8 text-white/80">
            Nền tảng cho thuê trang phục cao cấp dành cho những cá tính khác biệt. Biến mọi khoảnh khắc thành
            một dấu ấn đáng nhớ.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 md:justify-start">
            <button
              onClick={() => onNavigate?.('catalog')}
              className="border border-transparent bg-white px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition duration-500 hover:bg-[#99854e] hover:text-white"
            >
              Bộ sưu tập mới
            </button>
            <button className="group flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:text-[#99854e]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 transition group-hover:border-[#99854e]">
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              </span>
              Video giới thiệu
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
