import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import CatalogActiveFilters from '../components/catalog/CatalogActiveFilters';
import CatalogFilterSidebar from '../components/catalog/CatalogFilterSidebar';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { logUserInteraction } from '../services/interactionsService';

export default function CatalogPage({ onNavigate, onAddToCart }) {
  const searchInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const { costumes, isLoading, error } = useCatalogCostumes();
  const {
    searchTerm,
    selectedFilter,
    expandedCategories,
    expandedSubcategories,
    isMobileFilterOpen,
    filteredCostumes,
    setSearchTerm,
    setIsMobileFilterOpen,
    toggleCategory,
    toggleSubcategory,
    applyFilter,
    clearFilters,
  } = useCatalogFilters(costumes);

  useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      window.setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [searchParams]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim();
    if (normalizedSearch.length < 2) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      logUserInteraction({
        eventType: 'SEARCH',
        targetType: 'SEARCH',
        queryText: normalizedSearch,
        metadata: {
          category: selectedFilter.category,
          subcategory: selectedFilter.subcategory,
          tag: selectedFilter.tag,
        },
      }).catch(() => {});
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchTerm, selectedFilter]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Bộ sưu tập</p>
          <h1 className="mb-4 font-serif text-4xl font-normal italic text-black sm:text-5xl">Bộ sưu tập trang phục</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#5f5e5e]">
            Khám phá hàng ngàn sản phẩm đa dạng từ Cosplay, Sự kiện, Kỷ yếu đến Phụ kiện.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <CatalogFilterSidebar
            selectedFilter={selectedFilter}
            expandedCategories={expandedCategories}
            expandedSubcategories={expandedSubcategories}
            isMobileFilterOpen={isMobileFilterOpen}
            onSetMobileFilterOpen={setIsMobileFilterOpen}
            onClearFilters={clearFilters}
            onApplyFilter={applyFilter}
            onToggleCategory={toggleCategory}
            onToggleSubcategory={toggleSubcategory}
          />

          <div className="flex-1">
            <CatalogSearchBar
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onClearSearch={() => setSearchTerm('')}
            />

            <CatalogActiveFilters selectedFilter={selectedFilter} />

            <div className="mb-6">
              <p className="text-sm text-[#5f5e5e]">
                {isLoading ? (
                  'Đang tải sản phẩm từ database...'
                ) : (
                  <>
                    Tìm thấy <span className="font-medium text-black">{filteredCostumes.length}</span> trang phục
                  </>
                )}
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  Chưa kết nối được backend/database. Vui lòng chạy BE ở port 8080 rồi tải lại trang.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCostumes.map((costume) => (
                <CatalogProductCard
                  key={costume.id}
                  costume={costume}
                  onNavigate={onNavigate}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>

            {filteredCostumes.length === 0 && (
              <EmptyState
                className="py-20"
                icon="search_off"
                title="Không tìm thấy trang phục"
                message="Thử chọn danh mục khác hoặc xóa bộ lọc để xem thêm."
                actionLabel="Xóa tất cả bộ lọc"
                onAction={clearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
