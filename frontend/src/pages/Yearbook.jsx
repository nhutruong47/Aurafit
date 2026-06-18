import { useCostumes } from '../hooks/useCostumes';
import { fallbackProductImage, toCartItem } from '../utils/productMapper';

const styles = ['Học thuật', 'Truyền thống', 'Thanh xuân', 'Concept Hàn Quốc'];
const materials = ['Lụa', 'Cotton', 'Kaki', 'Tuytsi'];
const genders = ['Tất cả', 'Nữ', 'Nam', 'Cặp đôi'];

export default function Yearbook({ onAddToCart, onNavigate }) {
  const { costumes: yearbookProducts, isLoading, error } = useCostumes('yearbook');

  return (
    <div className="bg-[#f9f9f9] text-[#151515]">
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
            <button
              onClick={() => onNavigate?.('chat')}
              className="border border-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-[#99854e] hover:text-[#99854e]"
            >
              Tư vấn concept
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Hỗ trợ thuê theo lớp
              </p>
              <p className="mt-3 max-w-lg font-serif text-2xl italic leading-[1.25] md:text-4xl">
                Một lớp, một tone, nhưng mỗi người vẫn có khoảnh khắc riêng.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="yearbook-products" className="border-t border-[#cfc4c5]/60 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <div className="sticky top-28 space-y-9">
              <FilterGroup title="Phong cách" items={styles} />
              <FilterGroup title="Chất liệu" items={materials} />
              <div className="border border-[#cfc4c5] bg-[#f2f0eb] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Ưu đãi nhóm</p>
                <p className="mt-3 font-serif text-3xl italic leading-tight">15% cho lớp từ 8 outfit</p>
                <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
                  Team AuraFit hỗ trợ phối màu, size run và lịch giao đồ theo buổi chụp.
                </p>
              </div>
              <FilterGroup title="Giới tính" items={genders} />
            </div>
          </aside>

          <div className="md:col-span-9">
            <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#cfc4c5] pb-5 md:flex-row md:items-end">
                <div>
                <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Bộ Sưu Tập Kỷ Yếu</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
                  {isLoading
                    ? 'Đang tải sản phẩm Yearbook từ database...'
                    : `Đang hiển thị ${yearbookProducts.length} sản phẩm Yearbook từ database.`}
                </p>
                {error && <p className="mt-2 text-sm text-red-600">Chưa kết nối được backend/database.</p>}
              </div>
              <button className="w-fit border border-[#cfc4c5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black">
                Sắp xếp nổi bật
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {yearbookProducts.map((product, index) => (
                <CollectionCard key={product.name} product={product} index={index} onAddToCart={onAddToCart} />
              ))}
            </div>

            <div className="mt-14 flex items-center justify-center gap-3">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`h-10 w-10 border text-sm transition ${
                    page === 1
                      ? 'border-black bg-black text-white'
                      : 'border-[#cfc4c5] text-[#5f5e5e] hover:border-black hover:text-black'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f9f9f9] px-5 py-20 md:px-20 md:py-28">
        <div className="mx-auto max-w-[980px] text-center">
          <p className="font-serif text-3xl italic leading-[1.35] md:text-5xl">
            “Ảnh kỷ yếu đẹp nhất khi trang phục không lấn át người mặc, mà giúp câu chuyện thanh xuân hiện lên rõ hơn.”
          </p>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
            AuraFit Styling Desk
          </p>
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

function CollectionCard({ product, index, onAddToCart }) {
  return (
    <article className="group" style={{ animation: `fadeIn 0.7s ease-out ${index * 0.06}s both` }}>
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
          className="absolute inset-x-5 bottom-5 bg-white px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black opacity-0 transition duration-300 hover:bg-[#99854e] hover:text-white group-hover:opacity-100"
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
