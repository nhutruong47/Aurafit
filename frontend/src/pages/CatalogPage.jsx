import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import CatalogActiveFilters from '../components/catalog/CatalogActiveFilters';
import CatalogFilterSidebar from '../components/catalog/CatalogFilterSidebar';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import EventSideBanner from '../components/catalog/EventSideBanner';
import ShopPagination from '../components/shop/ShopPagination';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCategories } from '../hooks/useCatalogCategories';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents';
import { logUserInteraction } from '../services/interactionsService';
import { buildAncestorPaths, buildSelectedCategoryState } from '../utils/catalogCategory';
import { getCostumeTags } from '../utils/costumeUtils';

const CLIENT_PAGE_SIZE = 12;

export default function CatalogPage({ onNavigate }) {
  const searchInputRef = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const { leftEvent, rightEvent } = useFeaturedEvents(2);

  const initialCategoryPath = useMemo(
    () => searchParams.get('categoryPath') || location.state?.categoryPath || null,
    [location.state, searchParams]
  );

  const {
    categoryTree,
    categoriesByPath,
    isLoading: isLoadingCategories,
    error: categoryError,
  } = useCatalogCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryPath, setSelectedCategoryPath] = useState(initialCategoryPath);
  const [selectedTag, setSelectedTag] = useState(null);
  const [manualExpandedPaths, setManualExpandedPaths] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const selectedFilter = useMemo(
    () => buildSelectedCategoryState(selectedCategoryPath, categoriesByPath, selectedTag),
    [categoriesByPath, selectedCategoryPath, selectedTag]
  );
  const expandedPaths = useMemo(() => {
    const ancestorPaths = selectedCategoryPath
      ? buildAncestorPaths(selectedCategoryPath, categoriesByPath)
      : [];

    return [...new Set([...ancestorPaths, ...manualExpandedPaths])];
  }, [categoriesByPath, manualExpandedPaths, selectedCategoryPath]);

  useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      window.setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCategoryPath(initialCategoryPath);
    setSelectedTag(null);
  }, [initialCategoryPath]);

  const {
    costumes,
    activePage,
    totalPages,
    totalElements,
    setActivePage,
    isLoading,
    error,
  } = useCatalogCostumes({
    categoryPath: selectedFilter.categoryPath,
    keyword: searchTerm.trim(),
    sortBy,
    sortDir,
    pageSize: CLIENT_PAGE_SIZE,
  });

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
          categoryPath: selectedFilter.categoryPath,
          categoryName: selectedFilter.category,
          subcategory: selectedFilter.subcategory,
          tag: selectedFilter.tag,
        },
      }).catch(() => {});
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchTerm, selectedFilter]);

  const availableTags = useMemo(() => {
    const tagSet = new Set();

    costumes.forEach((costume) => {
      getCostumeTags(costume).forEach((tag) => {
        if (tag) {
          tagSet.add(tag);
        }
      });
    });

    return [...tagSet].sort((left, right) => left.localeCompare(right, 'vi'));
  }, [costumes]);

  const displayedCostumes = useMemo(() => {
    if (!selectedFilter.tag) {
      return costumes;
    }

    return costumes.filter((costume) => getCostumeTags(costume).includes(selectedFilter.tag));
  }, [costumes, selectedFilter.tag]);

  const displayedTotal = selectedFilter.tag ? displayedCostumes.length : totalElements;
  const displayedTotalPages = selectedFilter.tag ? 1 : totalPages;

  const applyFilter = (level, value) => {
    if (level === 'category') {
      setSelectedCategoryPath(value);
      setSelectedTag(null);
    }

    if (level === 'tag') {
      setSelectedTag((current) => (current === value ? null : value));
    }

    setIsMobileFilterOpen(false);
  };

  const toggleCategory = (categoryPath) => {
    setManualExpandedPaths((current) =>
      current.includes(categoryPath)
        ? current.filter((path) => path !== categoryPath)
        : [...current, categoryPath]
    );
  };

  const clearFilters = () => {
    setSelectedCategoryPath(null);
    setSelectedTag(null);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8 xl:px-0">
      <div className="w-full xl:grid xl:grid-cols-[minmax(120px,1fr)_minmax(0,1440px)_minmax(120px,1fr)] xl:items-stretch" data-event-page-grid="catalog">
        <aside className="hidden min-h-0 self-stretch xl:block xl:px-4" aria-label="Sự kiện nổi bật bên trái">
          {leftEvent && <EventSideBanner side="left" event={leftEvent} />}
        </aside>

        <div className="mx-auto w-full min-w-0 max-w-[1440px] xl:mx-0" data-event-page-content="catalog">
          <div className="mb-10">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Bộ sưu tập</p>
            <h1 className="mb-4 font-serif text-4xl font-normal italic text-black sm:text-5xl">Bộ sưu tập trang phục</h1>
            <p className="max-w-2xl text-lg leading-8 text-[#5f5e5e]">
              Danh mục và sản phẩm trên trang này được lấy trực tiếp từ database qua category tree API và costume catalog API của backend.
            </p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <CatalogFilterSidebar
              categoryTree={categoryTree}
              availableTags={availableTags}
              selectedFilter={selectedFilter}
              expandedPaths={expandedPaths}
              isMobileFilterOpen={isMobileFilterOpen}
              onSetMobileFilterOpen={setIsMobileFilterOpen}
              onClearFilters={clearFilters}
              onApplyFilter={applyFilter}
              onToggleCategory={toggleCategory}
            />

            <div className="flex-1">
              <CatalogSearchBar
                searchInputRef={searchInputRef}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onClearSearch={() => setSearchTerm('')}
              />

              <CatalogSortBar
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(nextSortBy, nextSortDir) => {
                  setSortBy(nextSortBy);
                  setSortDir(nextSortDir);
                }}
              />

              <CatalogActiveFilters selectedFilter={selectedFilter} />

              <div className="mb-6">
                <p className="text-sm text-[#5f5e5e]">
                  {isLoading || isLoadingCategories ? (
                    'Đang tải sản phẩm từ database...'
                  ) : (
                    <>
                      Đang hiển thị <span className="font-medium text-black">{displayedCostumes.length}</span> /{' '}
                      <span className="font-medium text-black">{displayedTotal}</span> trang phục
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
                {displayedCostumes.map((costume) => (
                  <CatalogProductCard key={costume.id} costume={costume} onNavigate={onNavigate} />
                ))}
              </div>

              {displayedTotal === 0 && !isLoading && !isLoadingCategories && (
                <EmptyState
                  className="py-20"
                  icon="search_off"
                  title="Không tìm thấy trang phục"
                  message="Thử chọn danh mục khác hoặc xóa bộ lọc để xem thêm dữ liệu thật từ database."
                  actionLabel="Xóa tất cả bộ lọc"
                  onAction={clearFilters}
                />
              )}

              {displayedTotalPages > 1 && !isLoading && !isLoadingCategories && !selectedFilter.tag && (
                <div className="mt-12">
                  <ShopPagination currentPage={activePage} totalPages={displayedTotalPages} onPageChange={setActivePage} />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 self-stretch xl:block xl:px-4" aria-label="Sự kiện nổi bật bên phải">
          {rightEvent && <EventSideBanner side="right" event={rightEvent} />}
        </aside>
      </div>
    </div>
  );
}
