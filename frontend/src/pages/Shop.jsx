import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes, fetchRecommendedCostumes, fetchSeasonalCostumes } from '../services/api';
import { fallbackProductImage, mapCostumeToProduct, toCartItem } from '../utils/productMapper';
import { formatCurrency } from '../utils/formatCurrency';

const seasonCopy = {
  spring: {
    label: 'Mua xuan',
    copy: 'Uu tien ky yeu, ao dai, vest sang va do su kien nhe.',
  },
  summer: {
    label: 'Mua he',
    copy: 'Uu tien cosplay, ky yeu, su kien ngoai troi va outfit de mac.',
  },
  autumn: {
    label: 'Mua thu',
    copy: 'Uu tien do su kien, concept chup anh va cosplay co lop.',
  },
  winter: {
    label: 'Mua dong',
    copy: 'Uu tien formalwear, party look, cosplay toi mau va phu kien di kem.',
  },
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return seasonCopy.spring;
  if (month >= 6 && month <= 8) return seasonCopy.summer;
  if (month >= 9 && month <= 11) return seasonCopy.autumn;
  return seasonCopy.winter;
}

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export default function Shop({ currentUser, onNavigate, onAddToCart }) {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const currentSeason = useMemo(() => getCurrentSeason(), []);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError('');

    Promise.all([
      fetchRecommendedCostumes(currentUser?.id),
      fetchSeasonalCostumes(),
      fetchCostumes(),
    ])
      .then(([recommendedData, seasonalData, allData]) => {
        if (!isMounted) return;
        setRecommendedProducts(Array.isArray(recommendedData) ? recommendedData.map(mapCostumeToProduct) : []);
        setSeasonalProducts(Array.isArray(seasonalData) ? seasonalData.map(mapCostumeToProduct) : []);
        setAllProducts(Array.isArray(allData) ? allData.map(mapCostumeToProduct) : []);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Khong the tai du lieu shop.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const habitProducts = uniqueProducts(recommendedProducts).slice(0, 8);
  const seasonProducts = uniqueProducts(seasonalProducts).slice(0, 8);
  const sortedAllProducts = uniqueProducts(recommendedProducts.length ? recommendedProducts : allProducts);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="border-b border-[#cfc4c5] bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-20 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">AuraFit Shop</p>
              <h1 className="font-serif text-[44px] font-normal italic leading-[1.1] md:text-[68px]">
                De xuat tu hanh vi va mua hien tai
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f5e5e]">
                Shop khong bat user tu chon tab. He thong doc du lieu theo doi san pham user xem, them gio, thanh toan va ket hop voi thoi gian hien tai de sap xep san pham.
              </p>
            </div>
            <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">SeasonalTrend</span>
                <span className="material-symbols-outlined text-[#99854e]">calendar_month</span>
              </div>
              <p className="font-serif text-3xl italic">{currentSeason.label}</p>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">{currentSeason.copy}</p>
              <div className="mt-5 border-t border-[#cfc4c5] pt-4 text-sm">
                <span className="text-[#5f5e5e]">UserPreference: </span>
                <strong>{currentUser ? `User #${currentUser.id}` : 'khach chua dang nhap'}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] space-y-16 px-5 py-12 md:px-20">
        {error && (
          <p className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
            {error}
          </p>
        )}

        {isLoading ? (
          <LoadingGrid />
        ) : (
          <>
            <ProductSection
              title="Đề xuất"
              caption={
                currentUser
                  ? 'Lay tu InteractionLog: san pham da xem, them gio va mua cua tai khoan nay.'
                  : 'Chua dang nhap nen he thong tam uu tien theo mua hien tai.'
              }
              products={habitProducts}
              badge="UserPreference"
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
            />

            <ProductSection
              title={`San pham hop ${currentSeason.label.toLowerCase()}`}
              caption="Tinh theo thang hien tai tren he thong, sau do uu tien category va tag phu hop mua."
              products={seasonProducts}
              badge="SeasonalTrend"
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
            />

            <ProductSection
              title="Tat ca san pham da sap xep"
              caption="Danh sach day du, san pham dung gu va dung mua duoc day len truoc."
              products={sortedAllProducts}
              badge="Shop"
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
              showAll
            />
          </>
        )}
      </main>
    </div>
  );
}

function ProductSection({ title, caption, products, badge, onNavigate, onAddToCart, showAll = false }) {
  const visibleProducts = showAll ? products : products.slice(0, 8);

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-3 border-b border-[#cfc4c5] pb-5 md:flex-row md:items-end">
        <div>
          <h2 className="font-serif text-3xl font-normal italic md:text-4xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5e5e]">{caption}</p>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
          {visibleProducts.length} san pham
        </p>
      </div>

      {visibleProducts.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard
              key={`${badge}-${product.id}`}
              product={product}
              badge={badge}
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="border border-[#cfc4c5] bg-white p-8 text-sm text-[#5f5e5e]">
          Chua co du lieu phu hop cho nhom nay.
        </div>
      )}
    </section>
  );
}

function ProductCard({ product, badge, onNavigate, onAddToCart }) {
  return (
    <article
      onClick={() => onNavigate?.('productDetail', product)}
      className="group cursor-pointer border border-[#cfc4c5] bg-white transition hover:border-[#99854e]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#eeeeee]">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          {badge}
        </span>

        {/* Hover overlay — hiện thông tin sản phẩm khi rê chuột */}
        <div className="absolute inset-0 z-[5] flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <h4 className="mb-1 line-clamp-2 font-serif text-lg italic leading-snug text-white">
            {product.name}
          </h4>
          {product.description && (
            <p className="mb-2 line-clamp-3 text-[11px] leading-[1.5] text-white/75">
              {product.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/60">
            {product.category && (
              <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                {product.category}
              </span>
            )}
            {product.subcategory && (
              <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                {product.subcategory}
              </span>
            )}
            {product.tag && (
              <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                {product.tag}
              </span>
            )}
            {product.size && (
              <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                Size {product.size}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-4 border-t border-white/15 pt-2.5 text-xs">
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">Giá thuê</span>
              <p className="mt-0.5 font-medium text-white">{formatCurrency(product.priceValue)}</p>
            </div>
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">Tiền cọc</span>
              <p className="mt-0.5 font-medium text-white">{formatCurrency(product.depositValue)}</p>
            </div>
            <span className={`ml-auto inline-block h-2 w-2 rounded-full ${product.available ? 'bg-emerald-400' : 'bg-red-400'}`} title={product.available ? 'Còn hàng' : 'Hết hàng'} />
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
          {product.category} | {product.tag || product.subcategory}
        </p>
        <h3 className="line-clamp-2 min-h-[48px] font-serif text-2xl italic leading-tight transition group-hover:text-[#99854e]">
          {product.name}
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Gia thue</p>
            <p className="mt-1 font-medium">{formatCurrency(product.priceValue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Tien coc</p>
            <p className="mt-1 font-medium">{formatCurrency(product.depositValue)}</p>
          </div>
        </div>
        <button
          disabled={!product.available}
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart?.(toCartItem(product));
          }}
          className={`mt-5 w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
            product.available
              ? 'bg-black text-white hover:bg-[#99854e]'
              : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
          }`}
        >
          Thue ngay
        </button>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-[420px] animate-pulse border border-[#cfc4c5] bg-white" />
      ))}
    </div>
  );
}
