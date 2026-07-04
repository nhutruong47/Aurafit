import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import CatalogActiveFilters from '../components/catalog/CatalogActiveFilters';
import CatalogFilterSidebar from '../components/catalog/CatalogFilterSidebar';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCategories } from '../hooks/useCatalogCategories';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { logUserInteraction } from '../services/interactionsService';

export default function CatalogPage({ onNavigate, onAddToCart, onRentNow }) {
  const searchInputRef = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialCategoryPath = useMemo(
    () => searchParams.get('categoryPath') || location.state?.categoryPath || null,
    [location.state, searchParams]
  );
  const { categoryTree, isLoading: isLoadingCategories, error: categoryError } = useCatalogCategories();
  const { costumes, isLoading, error } = useCatalogCostumes();
  const catalogFilters = useCatalogFilters(costumes, categoryTree, initialCategoryPath);

  useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      window.setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [searchParams]);

  useEffect(() => {
    const normalizedSearch = catalogFilters.searchTerm.trim();
    if (normalizedSearch.length < 2) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      logUserInteraction({
        eventType: 'SEARCH',
        targetType: 'SEARCH',
        queryText: normalizedSearch,
        metadata: {
          categoryPath: catalogFilters.selectedFilter.categoryPath,
          categoryName: catalogFilters.selectedFilter.category,
          subcategory: catalogFilters.selectedFilter.subcategory,
          tag: catalogFilters.selectedFilter.tag,
        },
      }).catch(() => {});
    }, 500);

    return () => window.clearTimeout(timer);
  }, [catalogFilters.searchTerm, catalogFilters.selectedFilter]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Bộ sưu tập</p>
          <h1 className="mb-4 font-serif text-4xl font-normal italic text-black sm:text-5xl">Bộ sưu tập trang phục</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#5f5e5e]">
            Danh mục và sản phẩm trên trang này đang được lấy trực tiếp từ database thông qua API catalog của backend.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <CatalogFilterSidebar
            categoryTree={categoryTree}
            availableTags={catalogFilters.availableTags}
            selectedFilter={catalogFilters.selectedFilter}
            expandedPaths={catalogFilters.expandedPaths}
            isMobileFilterOpen={catalogFilters.isMobileFilterOpen}
            onSetMobileFilterOpen={catalogFilters.setIsMobileFilterOpen}
            onClearFilters={catalogFilters.clearFilters}
            onApplyFilter={catalogFilters.applyFilter}
            onToggleCategory={catalogFilters.toggleCategory}
          />

          <div className="flex-1">
            <CatalogSearchBar
              searchInputRef={searchInputRef}
              searchTerm={catalogFilters.searchTerm}
              onSearchTermChange={catalogFilters.setSearchTerm}
              onClearSearch={() => catalogFilters.setSearchTerm('')}
            />

            <CatalogActiveFilters selectedFilter={catalogFilters.selectedFilter} />

            <div className="mb-6">
              <p className="text-sm text-[#5f5e5e]">
                {isLoading || isLoadingCategories ? (
                  'Đang tải sản phẩm từ database...'
                ) : (
                  <>
                    Tìm thấy <span className="font-medium text-black">{catalogFilters.filteredCostumes.length}</span> trang phục
                  </>
                )}
              </p>
              {(error || categoryError) && (
                <p className="mt-2 text-sm text-red-600">
                  Chưa kết nối được backend/database. Vui lòng chạy BE ở port 8080 rồi tải lại trang.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {catalogFilters.filteredCostumes.map((costume) => (
                <CatalogProductCard
                  key={costume.id}
                  costume={costume}
                  onNavigate={onNavigate}
                  onAddToCart={onAddToCart}
                  onRentNow={onRentNow}
                />
              ))}
            </div>

            {catalogFilters.filteredCostumes.length === 0 && !isLoading && !isLoadingCategories && (
              <EmptyState
                className="py-20"
                icon="search_off"
                title="Không tìm thấy trang phục"
                message="Thử chọn danh mục khác hoặc xóa bộ lọc để xem thêm dữ liệu từ catalog thật."
                actionLabel="Xóa tất cả bộ lọc"
                onAction={catalogFilters.clearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
