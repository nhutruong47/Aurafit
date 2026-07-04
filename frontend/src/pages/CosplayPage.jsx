import { useState } from 'react';
import UniversalFilterSidebar from '../components/catalog/UniversalFilterSidebar';
import CosplayHero from '../components/cosplay/CosplayHero';
import CosplayStepsSection from '../components/cosplay/CosplayStepsSection';
import ShopProductCard from '../components/shop/ShopProductCard';
import ShopPagination from '../components/shop/ShopPagination';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const accessoryHints = ['Tóc giả', 'Vũ khí mô phỏng', 'Trang sức', 'Bọc ủng'];

const thematicFilters = [
  { title: 'Thể loại', options: ['Anime', 'Game', 'Phim / TV', 'Manga', 'Giả tưởng'] },
  { title: 'Bộ sưu tập', options: ['Naruto', 'Demon Slayer', 'Genshin Impact', 'One Piece', 'Jujutsu Kaisen'] },
  { title: 'Size', options: ['S', 'M', 'L', 'XL', 'Free Size'] },
];

const processSteps = [
  ['01', 'Chọn nhân vật', 'Tìm set theo nguồn cảm hứng hoặc gửi reference cho stylist.'],
  ['02', 'Khóa phụ kiện', 'Thêm tóc giả, prop, bọc ủng và trang sức ngay trong giỏ hàng.'],
  ['03', 'Fitting nhanh', 'Đội ngũ kiểm tra form, độ dài tà và khả năng di chuyển.'],
  ['04', 'Hoàn trả gọn gàng', 'Trả đồ sau sự kiện, AuraFit xử lý vệ sinh và bảo quản.'],
];

export default function CosplayPage({ onNavigate }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  
  // Thematic filters are currently decorative since the backend groups "cosplay" already.
  const [selectedIds, setSelectedIds] = useState([]);

  const { costumes, activePage, totalPages, totalElements, setActivePage, isLoading, error } =
    useCatalogCostumes('cosplay', sortBy, sortDir);

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
    <div className="bg-[#f7f7f7] text-[#111111]">
      <CosplayHero onNavigate={onNavigate} />

      <section id="cosplay-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <UniversalFilterSidebar
              filterGroups={thematicFilters}
              selectedIds={selectedIds}
              onToggle={handleToggleFilter}
              onClearAll={handleClearFilters}
            >
              <div className="border border-[#cfc4c5] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Gợi ý phụ kiện</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {accessoryHints.map((hint) => (
                    <button
                      key={hint}
                      className="border border-[#cfc4c5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e] transition hover:border-black hover:text-black"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
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
                    Đang hiển thị <span className="font-medium text-black">{costumes.length}</span> / <span className="font-medium text-black">{totalElements}</span> set cosplay
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

            {costumes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {costumes.map((product) => (
                  <ShopProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <EmptyState
                  icon="filter_alt_off"
                  title="Không có set phù hợp"
                  message="Thử bỏ bớt bộ lọc hoặc chọn nhóm trang phục khác để xem thêm lựa chọn."
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

      <CosplayStepsSection steps={processSteps} />
    </div>
  );
}
