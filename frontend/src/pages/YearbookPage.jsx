import CollectionProductCard from '../components/costume/CollectionProductCard';
import YearbookCollectionHeader from '../components/yearbook/YearbookCollectionHeader';
import YearbookHero from '../components/yearbook/YearbookHero';
import YearbookQuoteSection from '../components/yearbook/YearbookQuoteSection';
import YearbookSidebar from '../components/yearbook/YearbookSidebar';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const styles = ['Học thuật', 'Truyền thống', 'Thanh xuân', 'Concept Hàn Quốc'];
const materials = ['Lụa', 'Cotton', 'Kaki', 'Tuytsi'];
const genders = ['Tất cả', 'Nữ', 'Nam', 'Cặp đôi'];

export default function YearbookPage({ onAddToCart, onNavigate }) {
  const { costumes: yearbookProducts, isLoading, error } = useCatalogCostumes('yearbook');

  return (
    <div className="bg-[#f9f9f9] text-[#151515]">
      <YearbookHero onNavigate={onNavigate} />

      <section id="yearbook-products" className="border-t border-[#cfc4c5]/60 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <YearbookSidebar styles={styles} materials={materials} genders={genders} />
          </aside>

          <div className="md:col-span-9">
            <YearbookCollectionHeader isLoading={isLoading} error={error} productCount={yearbookProducts.length} />

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {yearbookProducts.map((product, index) => (
                <CollectionProductCard key={product.name} product={product} index={index} onAddToCart={onAddToCart} />
              ))}
            </div>

            <div className="mt-14 flex items-center justify-center gap-3">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`h-10 w-10 border text-sm transition ${
                    page === 1
                      ? 'border-black bg-black text-white'
                      : 'border-[#cfc4c5] text-[#5f5e5e] hover:border-black hover:text-black'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <YearbookQuoteSection />
    </div>
  );
}
