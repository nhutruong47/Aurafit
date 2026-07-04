import { useState } from 'react';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import ShopPagination from '../components/shop/ShopPagination';
import CollectionProductCard from '../components/costume/CollectionProductCard';
import YearbookCollectionHeader from '../components/yearbook/YearbookCollectionHeader';
import YearbookHero from '../components/yearbook/YearbookHero';
import YearbookQuoteSection from '../components/yearbook/YearbookQuoteSection';
import YearbookSidebar from '../components/yearbook/YearbookSidebar';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const styles = ['Học thuật', 'Tốt nghiệp', 'Thanh xuân', 'Ngoại cảnh'];
const materials = ['Lụa', 'Cotton', 'Kaki', 'Tuytsi'];
const genders = ['Tất cả', 'Nữ', 'Nam', 'Cặp đôi'];

export default function YearbookPage({ onAddToCart, onNavigate }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const {
    costumes: yearbookProducts,
    activePage,
    totalPages,
    totalElements,
    setActivePage,
    isLoading,
    error,
  } = useCatalogCostumes('yearbook', sortBy, sortDir);

  return (
    <div className="bg-[#f9f9f9] text-[#151515]">
      <YearbookHero onNavigate={onNavigate} />

      <section id="yearbook-products" className="border-t border-[#cfc4c5]/60 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <YearbookSidebar styles={styles} materials={materials} genders={genders} />
          </aside>

          <div className="md:col-span-9">
            <YearbookCollectionHeader
              isLoading={isLoading}
              error={error}
              productCount={totalElements || yearbookProducts.length}
            />

            <CatalogSortBar sortBy={sortBy} sortDir={sortDir} onSortChange={(nextSortBy, nextSortDir) => {
              setSortBy(nextSortBy);
              setSortDir(nextSortDir);
            }} />

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {yearbookProducts.map((product, index) => (
                <CollectionProductCard key={product.id || product.name} product={product} index={index} onAddToCart={onAddToCart} />
              ))}
            </div>

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
