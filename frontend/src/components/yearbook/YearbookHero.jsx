// Hero section gioi thieu bo suu tap Yearbook.
export default function YearbookHero() {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-12 md:grid-cols-12 md:px-20 md:py-16">
      <div className="order-2 md:order-1 md:col-span-5">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">
          AuraFit Yearbook Atelier
        </p>
        <h1 className="font-serif text-[48px] font-normal italic leading-[1.12] md:text-[76px]">
          Kỷ yếu & Thanh xuân
        </h1>
        <p className="mt-7 max-w-xl text-base leading-8 text-[#5f5e5e]">
          Những set đồ học thuật, áo choàng tốt nghiệp và phụ kiện tinh chỉnh cho bộ ảnh kỷ yếu có chất riêng,
          chỉn chu từ khung hình đầu tiên.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <button
            onClick={() => document.getElementById('yearbook-products')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
          >
            Xem bộ sưu tập
          </button>
        </div>
      </div>

      <div className="order-1 md:order-2 md:col-span-7">
        <div className="relative aspect-[5/4] overflow-hidden bg-[#e8e8e8] md:aspect-[4/3]">
          <img
            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1500&q=85"
            alt="Nhóm sinh viên trong trang phục kỷ yếu học thuật"
            className="h-full w-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-7 text-white md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Hỗ trợ thuê theo lớp</p>
            <p className="mt-3 max-w-lg font-serif text-2xl italic leading-[1.25] md:text-4xl">
              Một lớp, một tone, nhưng mỗi người vẫn có khoảnh khắc riêng.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
