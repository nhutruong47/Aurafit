import { useState } from 'react';
import UniversalFilterSidebar from '../components/catalog/UniversalFilterSidebar';
import EventServicesSection from '../components/events/EventServicesSection';
import EventsHero from '../components/events/EventsHero';
import ShopProductCard from '../components/shop/ShopProductCard';
import ShopPagination from '../components/shop/ShopPagination';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const eventServices = [
  ['event_available', 'Giữ lịch thuê', 'Giữ lịch thuê theo ngày sự kiện và nhắc lịch hoàn trả.'],
  ['straighten', 'Kiểm tra form dáng', 'Stylist kiểm tra form, chiều dài tà và phụ kiện đi kèm.'],
  ['local_shipping', 'Giao nhận tận nơi', 'Giao nhận tận nơi cho gala, tiệc cưới và sự kiện buổi tối.'],
];

const thematicFilters = [
  { title: 'Dịp thuê', options: ['Gala', 'Khách dự tiệc cưới', 'Prom', 'Thảm đỏ'] },
  { title: 'Kiểu dáng', options: ['Đầm dài', 'Tuxedo', 'Cocktail', 'Suit'] },
  { title: 'Thời gian thuê', options: ['4 ngày', '8 ngày', '12 ngày'] },
];

export default function EventsPage({ onNavigate }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  
  const [selectedIds, setSelectedIds] = useState([]);

  const { costumes: eventProducts, activePage, totalPages, totalElements, setActivePage, isLoading, error } =
    useCatalogCostumes('events', sortBy, sortDir);

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
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <EventsHero onNavigate={onNavigate} />
      <EventServicesSection services={eventServices} />

      <section id="event-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <UniversalFilterSidebar
              filterGroups={thematicFilters}
              selectedIds={selectedIds}
              onToggle={handleToggleFilter}
              onClearAll={handleClearFilters}
            >
              <div className="border border-[#cfc4c5] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Event bundle</p>
                <p className="mt-3 font-serif text-3xl italic leading-tight">Thêm phụ kiện để khóa outfit.</p>
                <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
                  Khi thuê một món, giỏ hàng sẽ gợi ý túi, giày, trang sức hoặc khăn phù hợp.
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
                    Đang hiển thị <span className="font-medium text-black">{eventProducts.length}</span> / <span className="font-medium text-black">{totalElements}</span> trang phục sự kiện
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

            {eventProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {eventProducts.map((product) => (
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
    </div>
  );
}
