import CosplayCollectionHeader from '../components/cosplay/CosplayCollectionHeader';
import CosplayFilterSidebar from '../components/cosplay/CosplayFilterSidebar';
import CosplayHero from '../components/cosplay/CosplayHero';
import CosplayProductCard from '../components/cosplay/CosplayProductCard';
import CosplayStepsSection from '../components/cosplay/CosplayStepsSection';
import EmptyState from '../components/ui/EmptyState';
import { useCosplayFilters } from '../hooks/useCosplayFilters';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const filterGroups = [
  { key: 'subcategory', title: 'Thể loại' },
  { key: 'tag', title: 'Bộ sưu tập' },
  { key: 'size', title: 'Size' },
];

const accessoryHints = ['Tóc giả', 'Vũ khí mô phỏng', 'Trang sức', 'Bọc ủng'];

const processSteps = [
  ['01', 'Chọn nhân vật', 'Tìm set theo nguồn cảm hứng hoặc gửi reference cho stylist.'],
  ['02', 'Khóa phụ kiện', 'Thêm tóc giả, prop, bọc ủng và trang sức ngay trong giỏ hàng.'],
  ['03', 'Fitting nhanh', 'Đội ngũ kiểm tra form, độ dài tà và khả năng di chuyển.'],
  ['04', 'Hoàn trả gọn gàng', 'Trả đồ sau sự kiện, AuraFit xử lý vệ sinh và bảo quản.'],
];

export default function CosplayPage({ onAddToCart, onNavigate }) {
  const { costumes: cosplayProducts, isLoading, error } = useCatalogCostumes('cosplay');
  const {
    selectedFilters,
    quickFilter,
    setQuickFilter,
    availableFilterGroups,
    filteredProducts,
    activeFilterCount,
    toggleFilter,
    clearFilters,
  } = useCosplayFilters(cosplayProducts, filterGroups);

  return (
    <div className="bg-[#f7f7f7] text-[#111111]">
      <CosplayHero onNavigate={onNavigate} />

      <section id="cosplay-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <CosplayFilterSidebar
              availableFilterGroups={availableFilterGroups}
              selectedFilters={selectedFilters}
              onToggleFilter={toggleFilter}
              activeFilterCount={activeFilterCount}
              onClearFilters={clearFilters}
              accessoryHints={accessoryHints}
            />
          </aside>

          <div className="md:col-span-9">
            <CosplayCollectionHeader
              isLoading={isLoading}
              error={error}
              filteredCount={filteredProducts.length}
              totalCount={cosplayProducts.length}
              quickFilter={quickFilter}
              onQuickFilterChange={(filterKey) =>
                setQuickFilter((current) => (current === filterKey ? 'all' : filterKey))
              }
            />

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {filteredProducts.map((product, index) => (
                  <CosplayProductCard key={product.name} product={product} index={index} onAddToCart={onAddToCart} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="filter_alt_off"
                title="Không có set phù hợp"
                message="Thử bỏ bớt bộ lọc hoặc chọn nhóm trang phục khác để xem thêm lựa chọn."
                actionLabel="Xóa toàn bộ bộ lọc"
                onAction={clearFilters}
                className="px-8 py-16"
              />
            )}
          </div>
        </div>
      </section>

      <CosplayStepsSection steps={processSteps} />
    </div>
  );
}
