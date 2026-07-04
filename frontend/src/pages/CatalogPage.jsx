import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import UniversalFilterSidebar from '../components/catalog/UniversalFilterSidebar';
import ShopProductCard from '../components/shop/ShopProductCard';
import ShopPagination from '../components/shop/ShopPagination';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { logUserInteraction } from '../services/interactionsService';
import { fetchPublicCategories } from '../services/catalogService';

export default function CatalogPage({ onNavigate }) {
  const searchInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Categories state
  const [categories, setCategories] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter & Sort States
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch DB Categories on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const data = await fetchPublicCategories();
        if (isMounted && data) {
          setCategories(data);
        }
      } catch (err) {
        // Handle silently or log
      }
    };
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  // Currently backend only supports a single categoryId filter in the endpoint.
  // We'll pass the first selected category ID to the hook.
  const categoryId = selectedIds.length > 0 ? selectedIds[0] : null;

  // Fetch costumes
  const { costumes, activePage, totalPages, totalElements, setActivePage, isLoading, error } = useCatalogCostumes(
    categoryId,
    sortBy,
    sortDir,
    searchTerm,
    20
  );

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
          categoryId,
        },
      }).catch(() => {});
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchTerm, categoryId]);

  const handleClearFilters = () => {
    setSelectedIds([]);
    setSortBy('id');
    setSortDir('desc');
    setSearchTerm('');
  };

  const handleSortChange = (newSortBy, newSortDir) => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
  };

  const handleToggleFilter = (id) => {
    // If multiple selection is allowed in the future, we can toggle.
    // For now, if it's already selected, unselect it. Otherwise, set it as the only selected.
    setSelectedIds((prev) => (prev.includes(id) ? [] : [id]));
  };

  const filterGroups = [
    {
      title: 'Danh mục sản phẩm',
      options: categories.map(cat => ({ id: cat.id, label: cat.name }))
    }
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Bộ sưu tập</p>
          <h1 className="mb-4 font-serif text-4xl font-normal italic text-black sm:text-5xl">Bộ sưu tập trang phục</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#5f5e5e]">
            Khám phá hàng ngàn sản phẩm đa dạng với chất lượng cao cấp nhất.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full flex-shrink-0 lg:w-72">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="mb-4 flex w-full items-center justify-between border border-[#cfc4c5] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] lg:hidden"
            >
              <span>Lọc danh mục</span>
              <span className="material-symbols-outlined">{isMobileFilterOpen ? 'expand_less' : 'expand_more'}</span>
            </button>

            <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} lg:block`}>
              <UniversalFilterSidebar
                filterGroups={filterGroups}
                selectedIds={selectedIds}
                onToggle={handleToggleFilter}
                onClearAll={handleClearFilters}
              />
            </div>
          </aside>

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
              onSortChange={handleSortChange} 
            />

            <div className="mb-6">
              <p className="text-sm text-[#5f5e5e]">
                {isLoading ? (
                  'Đang tải sản phẩm từ database...'
                ) : (
                  <>
                    Đang hiển thị <span className="font-medium text-black">{costumes.length}</span> / <span className="font-medium text-black">{totalElements}</span> trang phục
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
              {costumes.map((costume) => (
                <ShopProductCard
                  key={costume.id}
                  product={costume}
                  onNavigate={onNavigate}
                />
              ))}
            </div>

            {costumes.length === 0 && !isLoading && (
              <EmptyState
                className="py-20"
                icon="search_off"
                title="Không tìm thấy trang phục"
                message="Thử chọn danh mục khác hoặc xóa bộ lọc để xem thêm."
                actionLabel="Xóa tất cả bộ lọc"
                onAction={handleClearFilters}
              />
            )}

            {totalPages > 1 && (
              <div className="mt-12">
                <ShopPagination currentPage={activePage} totalPages={totalPages} onPageChange={setActivePage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
