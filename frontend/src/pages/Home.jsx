import { useMemo, useRef, useState } from 'react';
import { useCostumes } from '../hooks/useCostumes';
import { fallbackProductImage, toCartItem } from '../utils/productMapper';

const services = [
  {
    icon: 'checkroom',
    title: 'Select Your Style',
    copy: 'Browse our curated collection and choose the piece that matches your personality.',
  },
  {
    icon: 'calendar_month',
    title: 'Book Your Dates',
    copy: 'Pick your event dates. We ensure the item is perfectly tailored and ready for you.',
  },
  {
    icon: 'autorenew',
    title: 'Flaunt & Return',
    copy: "Shine at your event. After you're done, just pack it back. We handle the cleaning.",
  },
];

const mosaicCategories = [
  {
    title: 'Elite Tech',
    copy: 'Latest releases from Sony, Apple & Leica',
    cta: 'Explore Tech',
    wide: true,
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
  },
  {
    title: 'Signature Fashion',
    copy: 'Designer gowns and bespoke tailoring',
    cta: 'View Wardrobe',
    wide: true,
    image:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
  },
  {
    title: 'Timepieces',
    image:
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=85',
  },
  {
    title: 'Gaming Gear',
    image:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=85',
  },
  {
    title: 'Events',
    image:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=85',
  },
  {
    title: 'Travel',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85',
  },
];

const styleCategories = [
  {
    title: 'Sự kiện',
    copy: 'Gala - Wedding - Red Carpet',
    image:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Cosplay',
    copy: 'Fantasy - Avant-Garde - Artistic',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Kỷ yếu',
    copy: 'Academic - Vintage - Modern Grad',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Phụ kiện',
    copy: 'Bags - Jewelry - Heritage Items',
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Concept',
    copy: 'Editorial - High Fashion - Studio',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85',
  },
];

const featuredTabs = [
  { key: 'event', label: 'Sự kiện' },
  { key: 'cosplay', label: 'Cosplay' },
  { key: 'yearbook', label: 'Kỷ yếu' },
  { key: 'accessories', label: 'Phụ kiện' },
];


const trustMarkers = [
  {
    icon: 'verified',
    title: 'Chính hãng',
    copy: 'Sản phẩm từ các nhà mốt danh tiếng',
  },
  {
    icon: 'eco',
    title: 'Bền vững',
    copy: 'Quy trình xử lý sinh học 100%',
  },
  {
    icon: 'local_shipping',
    title: 'Giao nhanh',
    copy: 'Phục vụ tận tâm trong vòng 2 giờ',
  },
  {
    icon: 'support_agent',
    title: 'Cố vấn 24/7',
    copy: 'Tư vấn phong cách từ chuyên gia',
  },
];

export default function Home({ onNavigate, onAddToCart }) {
  const [activeTab, setActiveTab] = useState('event');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const sliderRef = useRef(null);
  const { costumes, isLoading } = useCostumes();
  const products = useMemo(
    () => ({
      event: costumes.filter((product) => product.rawCategory === 'Events').slice(0, 4),
      cosplay: costumes.filter((product) => product.rawCategory === 'Cosplay').slice(0, 4),
      yearbook: costumes.filter((product) => product.rawCategory === 'Yearbook').slice(0, 4),
      accessories: costumes.filter((product) => product.rawCategory === 'Accessories').slice(0, 4),
    }),
    [costumes]
  );
  const trending = useMemo(() => costumes.slice(0, 4), [costumes]);

  const scrollSlider = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const amount = slider.clientWidth * 0.82;
    slider.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
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
              Haute Couture Rentals
            </p>
            <h1 className="font-serif text-[44px] font-normal italic leading-[1.08] md:text-[72px]">
              The Vibe <br /> Rental Edit
            </h1>
            <p className="mt-8 max-w-xl text-lg font-light italic leading-8 text-white/80">
              Nền tảng cho thuê trang phục cao cấp dành cho những cá tính khác biệt. Biến mọi khoảnh khắc thành một tác phẩm nghệ thuật.
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
                Showreel
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f9f9f9] py-24 md:py-[120px]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-20">
          <div className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">
              Dịch vụ của chúng tôi
            </p>
            <h2 className="font-serif text-4xl font-normal md:text-5xl">Seamless Rental Experience</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="border border-[#cfc4c5]/30 bg-white p-10 text-center transition duration-500 hover:border-[#99854e]/40 md:p-12"
              >
                <span className="material-symbols-outlined mb-8 block text-[40px] text-[#99854e]">
                  {service.icon}
                </span>
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">{service.title}</h3>
                <p className="text-base italic leading-7 text-[#4c4546]">{service.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f9f9f9] py-24 md:py-[120px]" id="categories">
        <div className="mx-auto max-w-[1440px] px-5 md:px-20">
          <div className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Khám phá</p>
            <h2 className="font-serif text-4xl font-normal md:text-5xl">Shop by Category</h2>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {mosaicCategories
              .filter((category) => category.wide)
              .map((category) => (
                <CategoryTile key={category.title} category={category} wide onClick={() => onNavigate?.('catalog')} />
              ))}
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {mosaicCategories
              .filter((category) => !category.wide)
              .map((category) => (
                <CategoryTile key={category.title} category={category} onClick={() => onNavigate?.('catalog')} />
              ))}
          </div>
        </div>
      </section>

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
                onClick={() => scrollSlider('left')}
                className="flex h-12 w-12 items-center justify-center border border-[#cfc4c5]/40 transition hover:bg-[#99854e] hover:text-white"
                aria-label="Cuộn trái"
              >
                <span className="material-symbols-outlined">west</span>
              </button>
              <button
                onClick={() => scrollSlider('right')}
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
            {styleCategories.map((category) => {
              const routeMap = {
                'Sự kiện': 'events',
                'Cosplay': 'cosplay',
                'Kỷ yếu': 'yearbook',
                'Phụ kiện': 'catalog', // We don't have an accessories page, route to catalog
                'Concept': 'catalog'
              };
              return (
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
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f7] py-24 md:py-[120px]" id="featured">
        <div className="mx-auto max-w-[1440px] px-5 md:px-20">
          <div className="mb-16 flex flex-col items-baseline justify-between gap-10 md:flex-row">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">The Collection</p>
              <h2 className="font-serif text-4xl font-normal md:text-5xl">Sản phẩm nổi bật</h2>
            </div>
            <div className="flex flex-wrap gap-6 md:gap-8">
              {featuredTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
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
            <p className="text-sm italic text-[#5f5e5e]">Đang tải sản phẩm từ database...</p>
          ) : (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {products[activeTab].map((product) => (
                <ProductCard key={product.id || product.name} product={product} onAddToCart={onAddToCart} onNavigate={onNavigate} />
              ))}
            </div>
          )}

          <div className="mt-20 flex justify-center">
            <button
              onClick={() => onNavigate?.('catalog')}
              className="group flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:text-[#99854e]"
            >
              <span>Khám phá toàn bộ sưu tập</span>
              <span className="material-symbols-outlined text-[16px]">east</span>
            </button>
          </div>
        </div>
      </section>

      <section className="border-y border-[#cfc4c5]/25 bg-[#f9f9f9] py-24">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-12 px-5 md:grid-cols-4 md:px-20">
          {trustMarkers.map((marker) => (
            <article key={marker.title} className="text-center">
              <span className="material-symbols-outlined mb-6 block text-[32px] text-[#99854e]">{marker.icon}</span>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">{marker.title}</h3>
              <p className="text-base italic leading-7 text-[#4c4546]">{marker.copy}</p>
            </article>
          ))}
        </div>
      </section>

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

      <section className="bg-[#f7f7f7] px-5 pb-24 md:px-20 md:pb-[120px]">
        <div className="relative mx-auto max-w-[1440px] overflow-hidden bg-black px-6 py-24 text-center md:py-36">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20" />
          <div className="relative z-10">
            <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#99854e]">The Insider Club</p>
            <h2 className="mb-10 font-serif text-4xl font-normal italic text-white md:text-6xl">
              Gia nhập cộng đồng <br /> AuraFit
            </h2>
            <p className="mx-auto mb-14 max-w-2xl text-lg font-light italic leading-8 text-white/70">
              Nhận đặc quyền ưu đãi 20% cho đơn hàng đầu tiên và truy cập sớm vào các bộ sưu tập giới hạn.
            </p>
            {isSubscribed ? (
              <div className="mx-auto max-w-xl border border-[#99854e] bg-black px-8 py-10 text-center text-white shadow-2xl animate-[fadeIn_0.5s_ease-out]">
                <span className="material-symbols-outlined mb-4 text-4xl text-[#99854e]">redeem</span>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">
                  Đăng ký thành công!
                </p>
                <p className="mb-6 text-sm italic text-white/80">
                  Chào mừng bạn đến với Insider Club. Như một lời cảm ơn, đây là voucher giảm giá 20% cho đơn hàng đầu tiên của bạn:
                </p>
                <div className="mx-auto mb-6 flex max-w-sm items-center justify-between border border-dashed border-[#cfc4c5]/40 bg-[#1a1c1c] p-4">
                  <span className="font-mono text-xl font-bold tracking-widest text-white">AURA20WELCOME</span>
                  <button 
                    onClick={(e) => {
                      navigator.clipboard.writeText('AURA20WELCOME');
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>Đã copy';
                      setTimeout(() => btn.innerHTML = originalText, 2000);
                    }}
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#99854e] transition hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy
                  </button>
                </div>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-[#99854e] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
                >
                  Bắt đầu thuê nghiệm
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setIsSubscribed(true);
                }}
                className="mx-auto flex max-w-xl flex-col border border-white/20 sm:flex-row"
              >
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-none bg-transparent px-7 py-5 text-white placeholder-white/40 outline-none"
                  placeholder="Email của bạn..."
                  type="email"
                />
                <button 
                  type="submit"
                  className="bg-white px-10 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#99854e] hover:text-white"
                >
                  Đăng ký ngay
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryTile({ category, wide = false, onClick }) {
  return (
    <article onClick={onClick} className={`group relative cursor-pointer overflow-hidden bg-black ${wide ? 'aspect-[16/10]' : 'aspect-square'}`}>
      <img
        src={category.image}
        alt={category.title}
        className="h-full w-full object-cover opacity-60 transition duration-1000 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className={wide ? 'absolute bottom-0 left-0 p-8 md:p-10' : 'absolute bottom-0 left-0 p-5 md:p-6'}>
        <h3 className={`${wide ? 'text-3xl md:text-4xl' : 'text-xl'} mb-2 font-serif italic text-white`}>
          {category.title}
        </h3>
        {wide && <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">{category.copy}</p>}
        <span className="inline-block border-b border-white pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition group-hover:border-[#99854e] group-hover:text-[#99854e]">
          {category.cta || 'Shop'}
        </span>
      </div>
    </article>
  );
}

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
