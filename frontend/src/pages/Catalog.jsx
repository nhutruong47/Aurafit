import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import CatalogActiveFilters from '../components/catalog/CatalogActiveFilters';
import CatalogFilterSidebar from '../components/catalog/CatalogFilterSidebar';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import EmptyState from '../components/ui/EmptyState';
import { useCostumes } from '../hooks/useCostumes';
import { useCatalogFilters } from '../hooks/useCatalogFilters';

export default function Catalog({ onNavigate, onAddToCart }) {
  const searchInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const { costumes, isLoading, error } = useCostumes();
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

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">The Collection</p>
          <h1 className="mb-4 font-serif text-4xl font-normal italic text-black sm:text-5xl">Bá»™ sÆ°u táº­p trang phá»¥c</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#5f5e5e]">
            KhÃ¡m phÃ¡ hÃ ng ngÃ n sáº£n pháº©m Ä‘a dáº¡ng tá»« Cosplay, Sá»± kiá»‡n, Ká»· yáº¿u Ä‘áº¿n Phá»¥ kiá»‡n.
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
                  'Äang táº£i sáº£n pháº©m tá»« database...'
                ) : (
                  <>
                    TÃ¬m tháº¥y <span className="font-medium text-black">{filteredCostumes.length}</span> trang phá»¥c
                  </>
                )}
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  ChÆ°a káº¿t ná»‘i Ä‘Æ°á»£c backend/database. Vui lÃ²ng cháº¡y BE á»Ÿ port 8080 rá»“i táº£i láº¡i trang.
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
                title="KhÃ´ng tÃ¬m tháº¥y trang phá»¥c"
                message="Thá»­ chá»n danh má»¥c khÃ¡c hoáº·c xÃ³a bá»™ lá»c Ä‘á»ƒ xem thÃªm."
                actionLabel="XÃ³a táº¥t cáº£ bá»™ lá»c"
                onAction={clearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
