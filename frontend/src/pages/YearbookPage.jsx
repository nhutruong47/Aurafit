import { useMemo, useState } from 'react';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import EmptyState from '../components/ui/EmptyState';
import ShopPagination from '../components/shop/ShopPagination';
import YearbookCollectionHeader from '../components/yearbook/YearbookCollectionHeader';
import YearbookHero from '../components/yearbook/YearbookHero';
import YearbookQuoteSection from '../components/yearbook/YearbookQuoteSection';
import YearbookSidebar from '../components/yearbook/YearbookSidebar';
import { useCatalogCategories } from '../hooks/useCatalogCategories';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

export default function YearbookPage({ onNavigate }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryPath, setSelectedCategoryPath] = useState(null);
  const {
    categoriesByPath,
    isLoading: isLoadingCategories,
    error: categoryError,
  } = useCatalogCategories();

  const yearbookCategoryOptions = useMemo(() => {
    const root = categoriesByPath.get('ky-yeu');
    return Array.isArray(root?.children)
      ? root.children.map((category) => ({
          id: category.path,
          label: category.name,
        }))
      : [];
  }, [categoriesByPath]);

  const {
    costumes: yearbookProducts,
    activePage,
    totalPages,
    totalElements,
    setActivePage,
    isLoading,
    error,
  } = useCatalogCostumes({
    categoryPath: selectedCategoryPath || 'ky-yeu',
    keyword: searchTerm.trim(),
    sortBy,
    sortDir,
  });

  const handleToggleCategory = (categoryPath) => {
    setSelectedCategoryPath((current) => (current === categoryPath ? null : categoryPath));
  };

  const handleClearFilters = () => {
    setSelectedCategoryPath(null);
    setSearchTerm('');
    setSortBy('id');
    setSortDir('desc');
  };

  return (
    <div className="bg-[#f9f9f9] text-[#151515]">
      <YearbookHero onNavigate={onNavigate} />

      <section id="yearbook-products" className="border-t border-[#cfc4c5]/60 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <YearbookSidebar
              categories={yearbookCategoryOptions}
              selectedCategoryPath={selectedCategoryPath}
              onToggleCategory={handleToggleCategory}
              onClearFilters={handleClearFilters}
            />
          </aside>

          <div className="md:col-span-9">
            <YearbookCollectionHeader
              isLoading={isLoading || isLoadingCategories}
              error={error || categoryError}
              productCount={totalElements || yearbookProducts.length}
            />

            <CatalogSearchBar
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

            {yearbookProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {yearbookProducts.map((product) => (
                  <CatalogProductCard key={product.id || product.name} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              !isLoading &&
              !isLoadingCategories && (
                <EmptyState
                  icon="photo_library"
                  title="Chưa tìm thấy mẫu phù hợp"
                  message="Bạn hãy thử đổi từ khóa hoặc nới bớt bộ lọc để xem thêm lựa chọn khác."
                  actionLabel="Xóa bộ lọc"
                  onAction={handleClearFilters}
                  className="px-8 py-16"
                />
              )
            )}

            {totalPages > 1 && (
              <div className="mt-12">
                <ShopPagination currentPage={activePage} totalPages={totalPages} onPageChange={setActivePage} />
              </div>
            )}
          </div>
        </div>
      </section>

      <YearbookQuoteSection />
    </div>
  );
}
