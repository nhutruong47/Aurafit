import { useState } from 'react';
import UniversalFilterSidebar from '../components/catalog/UniversalFilterSidebar';
import YearbookCollectionHeader from '../components/yearbook/YearbookCollectionHeader';
import YearbookHero from '../components/yearbook/YearbookHero';
import YearbookQuoteSection from '../components/yearbook/YearbookQuoteSection';
import ShopProductCard from '../components/shop/ShopProductCard';
import ShopPagination from '../components/shop/ShopPagination';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const thematicFilters = [
  { title: 'Phong cách', options: ['Học thuật', 'Truyền thống', 'Thanh xuân', 'Concept Hàn Quốc'] },
  { title: 'Chất liệu', options: ['Lụa', 'Cotton', 'Kaki', 'Tuytsi'] },
  { title: 'Giới tính', options: ['Tất cả', 'Nữ', 'Nam', 'Cặp đôi'] },
];

export default function YearbookPage({ onNavigate }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  const [selectedIds, setSelectedIds] = useState([]);

  const { costumes: yearbookProducts, activePage, totalPages, totalElements, setActivePage, isLoading, error } =
    useCatalogCostumes('yearbook', sortBy, sortDir);

  const handleSortChange = (newSortBy, newSortDir) => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
  };

  const handleClearFilters = () => {
    setSortBy('id');
    setSortDir('desc');
    setSelectedIds([]);
  };

  const handleToggleFilter = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="bg-[#f9f9f9] text-[#151515]">
      <YearbookHero onNavigate={onNavigate} />

      <section id="yearbook-products" className="border-t border-[#cfc4c5]/60 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <UniversalFilterSidebar
              filterGroups={thematicFilters}
              selectedIds={selectedIds}
              onToggle={handleToggleFilter}
              onClearAll={handleClearFilters}
            >
              <div className="border border-[#cfc4c5] bg-[#f2f0eb] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Ưu đãi nhóm</p>
                <p className="mt-3 font-serif text-3xl italic leading-tight">15% cho lớp từ 8 outfit</p>
                <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
                  Team AuraFit hỗ trợ phối màu, size run và lịch giao đồ theo buổi chụp.
                </p>
              </div>
            </UniversalFilterSidebar>
          </aside>

          <div className="md:col-span-9">
            <div className="mb-6">
              <p className="text-sm text-[#5f5e5e]">
                {isLoading ? (
                  'Đang tải sản phẩm từ database...'
                ) : (
                  <>
                    Đang hiển thị <span className="font-medium text-black">{yearbookProducts.length}</span> / <span className="font-medium text-black">{totalElements}</span> trang phục kỷ yếu
                  </>
                )}
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  Chưa kết nối được backend/database. Vui lòng chạy BE ở port 8080 rồi tải lại trang.
                </p>
              )}
            </div>

            <CatalogSortBar sortBy={sortBy} sortDir={sortDir} onSortChange={handleSortChange} />

            {yearbookProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {yearbookProducts.map((product) => (
                  <ShopProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <EmptyState
                  icon="search_off"
                  title="Không tìm thấy trang phục"
                  message="Thử chọn danh mục khác hoặc xóa bộ lọc để xem thêm."
                  actionLabel="Xóa toàn bộ bộ lọc"
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
