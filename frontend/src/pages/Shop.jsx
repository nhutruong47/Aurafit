import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes, fetchRecommendedCostumes, fetchSeasonalCostumes } from '../services/api';
import { fallbackProductImage, mapCostumeToProduct, toCartItem } from '../utils/productMapper';
import { formatCurrency } from '../utils/formatCurrency';

const PAGE_SIZE = 20;

const tabs = [
  { id: 'recommended', label: 'De xuat', icon: 'auto_awesome' },
  { id: 'trending', label: 'Xu huong', icon: 'trending_up' },
  { id: 'all', label: 'Tat ca san pham', icon: 'grid_view' },
];

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export default function Shop({ currentUser, onNavigate, onAddToCart }) {
  const [activeTab, setActiveTab] = useState('recommended');
  const [pageByTab, setPageByTab] = useState({ recommended: 1, trending: 1, all: 1 });
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

        setRecommendedProducts(uniqueProducts((recommendedData || []).map(mapCostumeToProduct)));
        setTrendingProducts(uniqueProducts((seasonalData || []).map(mapCostumeToProduct)));
        setAllProducts(uniqueProducts((allData || []).map(mapCostumeToProduct)));
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Khong the tai du lieu shop chung.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const productsByTab = useMemo(
    () => ({
      recommended: recommendedProducts,
      trending: trendingProducts,
      all: allProducts,
    }),
    [allProducts, recommendedProducts, trendingProducts]
  );

  const activeProducts = productsByTab[activeTab] || [];
  const activePage = pageByTab[activeTab] || 1;
  const totalPages = Math.max(1, Math.ceil(activeProducts.length / PAGE_SIZE));
  const visibleProducts = activeProducts.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const setActivePage = (page) => {
    setPageByTab((currentPages) => ({
      ...currentPages,
      [activeTab]: Math.min(Math.max(page, 1), totalPages),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPageByTab((currentPages) => ({
      ...currentPages,
      [tabId]: currentPages[tabId] || 1,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="border-b border-[#cfc4c5] bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-20 md:py-16">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">
            AuraFit Shop
          </p>
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="font-serif text-[44px] font-normal italic leading-[1.1] md:text-[68px]">
                Shop chung cho tat ca trang phuc
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f5e5e]">
                Tat ca san pham deu do AuraFit Admin quan ly. Xem nhanh theo de xuat ca nhan,
                xu huong theo mua, hoac toan bo kho trang phuc.
              </p>
            </div>
            <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Pagination
                </span>
                <span className="material-symbols-outlined text-[#99854e]">view_module</span>
              </div>
              <p className="font-serif text-3xl italic">20 san pham / trang</p>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                Moi nhom san pham co phan trang rieng de xem nhanh va khong bi qua tai.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-20">
        <div className="mb-8 grid gap-3 border border-[#cfc4c5] bg-white p-3 md:grid-cols-3">
          {tabs.map((tab) => {
            const count = productsByTab[tab.id]?.length || 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-between gap-4 border px-5 py-4 text-left transition ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-[#e1dddc] bg-[#fafafa] text-black hover:border-[#99854e]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">{tab.label}</span>
                </span>
                <span className={`text-xs ${isActive ? 'text-white/70' : 'text-[#777777]'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#cfc4c5] pb-5 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-3xl font-normal italic md:text-4xl">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">
              Dang hien {visibleProducts.length} / {activeProducts.length} san pham.
            </p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
            Trang {activePage} / {totalPages}
          </p>
        </div>

        {error && (
          <p className="mb-6 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
            {error}
          </p>
        )}

        {isLoading ? (
          <LoadingGrid />
        ) : visibleProducts.length ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={`${activeTab}-${product.id}`}
                  product={product}
                  onNavigate={onNavigate}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
            <Pagination currentPage={activePage} totalPages={totalPages} onPageChange={setActivePage} />
          </>
        ) : (
          <div className="border border-[#cfc4c5] bg-white p-10 text-center">
            <span className="material-symbols-outlined mb-4 text-[44px] text-[#99854e]">inventory_2</span>
            <h3 className="font-serif text-3xl italic">Chua co san pham</h3>
            <p className="mt-3 text-sm text-[#5f5e5e]">Nhom nay chua co du lieu phu hop.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({ product, onNavigate, onAddToCart }) {
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
          {product.category}
        </span>
        <span
          className={`absolute right-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {product.available ? 'Con hang' : 'Tam het'}
        </span>
      </div>
      <div className="p-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
          {product.subcategory || product.rawCategory} {product.tag ? `| ${product.tag}` : ''}
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

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center border border-[#cfc4c5] bg-white disabled:cursor-not-allowed disabled:text-[#cfc4c5]"
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-[18px]">west</span>
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-10 min-w-10 border px-3 text-sm font-semibold ${
            page === currentPage
              ? 'border-black bg-black text-white'
              : 'border-[#cfc4c5] bg-white text-black hover:border-[#99854e]'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center border border-[#cfc4c5] bg-white disabled:cursor-not-allowed disabled:text-[#cfc4c5]"
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-[18px]">east</span>
      </button>
    </div>
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
