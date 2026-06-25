import AiStylistBox from '../components/ai/AiStylistBox';
import PersonalizedRecommendationSection from '../components/ai/PersonalizedRecommendationSection';
import ShopPagination from '../components/shop/ShopPagination';
import ShopProductCard from '../components/shop/ShopProductCard';
import { shopTabs } from '../components/shop/shopTabs';
import AlertMessage from '../components/ui/AlertMessage';
import EmptyState from '../components/ui/EmptyState';
import LoadingGrid from '../components/ui/LoadingGrid';
import { useAiRecommendations } from '../hooks/useAiRecommendations';
import { trackRecommendationClick } from '../services/interactionsService';
import { useShopCostumes } from '../hooks/useShopCostumes';

export default function ShopPage({ currentUser, onNavigate, onAddToCart }) {
  const {
    activeTab,
    productsByTab,
    activeProducts,
    activePage,
    totalPages,
    visibleProducts,
    isLoading,
    error,
    handleTabChange,
    setActivePage,
  } = useShopCostumes(currentUser?.id);
  const {
    personalized,
    queryResult,
    isLoadingPersonalized,
    isLoadingQuery,
    error: aiError,
    submitAiQuery,
  } = useAiRecommendations({
    autoLoadPersonalized: Boolean(currentUser?.id),
    personalizedLimit: 4,
    currentUserId: currentUser?.id,
  });

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
                Shop chung cho tất cả trang phục
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f5e5e]">
                Tất cả sản phẩm đều do AuraFit Admin quản lý. Xem nhanh theo đề xuất cá nhân,
                xu hướng theo mùa, hoặc toàn bộ kho trang phục.
              </p>
            </div>
            <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Pagination
                </span>
                <span className="material-symbols-outlined text-[#99854e]">view_module</span>
              </div>
              <p className="font-serif text-3xl italic">20 sản phẩm / trang</p>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                Mỗi nhóm sản phẩm có phân trang riêng để xem nhanh và không bị quá tải.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-20">
        <div className="mb-8 grid gap-6 xl:grid-cols-[420px_1fr]">
          <AiStylistBox
            title="AI Stylist Box"
            description="Nhap nhu cau, style, mau va budget de AI chon cac mon do thue phu hop nhat."
            isLoading={isLoadingQuery}
            onSubmit={submitAiQuery}
          />
          <PersonalizedRecommendationSection
            title="Goi y co ly do"
            subtitle={
              queryResult.items.length
                ? queryResult.queryText || 'Ket qua truy van AI tu nhu cau hien tai.'
                : personalized.profileSummary || 'Tab recommendation mac dinh van giu nguyen, phan nay them ly do AI de de so sanh.'
            }
            items={queryResult.items.length ? queryResult.items : personalized.items}
            isLoading={isLoadingPersonalized && !queryResult.items.length}
            emptyMessage="Hay nhap nhu cau o AI Stylist Box de nhan goi y chi tiet."
            onNavigate={onNavigate}
            onTrackClick={(item) =>
              trackRecommendationClick({
                productId: item.product.id,
                sourcePage: 'shop',
                sourceModule: queryResult.items.length ? 'ai-query' : 'personalized-section',
                reason: item.reason,
              })
            }
          />
        </div>

        <div className="mb-8 grid gap-3 border border-[#cfc4c5] bg-white p-3 md:grid-cols-3">
          {shopTabs.map((tab) => {
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
              {shopTabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">
              Đang hiển thị {visibleProducts.length} / {activeProducts.length} sản phẩm.
            </p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
            Trang {activePage} / {totalPages}
          </p>
        </div>

        {(error || aiError) && <AlertMessage text={error || aiError} className="mb-6" />}

        {isLoading ? (
          <LoadingGrid />
        ) : visibleProducts.length ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ShopProductCard
                  key={`${activeTab}-${product.id}`}
                  product={product}
                  onNavigate={onNavigate}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
            <ShopPagination currentPage={activePage} totalPages={totalPages} onPageChange={setActivePage} />
          </>
        ) : (
          <EmptyState
            icon="inventory_2"
            title="Chưa có sản phẩm"
            message="Nhóm này chưa có dữ liệu phù hợp."
          />
        )}
      </main>
    </div>
  );
}
