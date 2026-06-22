import CollectionProductCard from '../components/costume/CollectionProductCard';
import EventsCollectionHeader from '../components/events/EventsCollectionHeader';
import EventServicesSection from '../components/events/EventServicesSection';
import EventsHero from '../components/events/EventsHero';
import EventsSidebar from '../components/events/EventsSidebar';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

const occasions = ['Gala', 'Wedding Guest', 'Prom Night', 'Red Carpet'];
const silhouettes = ['Gown', 'Tuxedo', 'Cocktail', 'Suit'];
const rentalWindows = ['4 Days', '8 Days', '12 Days'];

const eventServices = [
  ['event_available', 'Date lock', 'Giữ lịch thuê theo ngày sự kiện và nhắc lịch trả đồ.'],
  ['straighten', 'Fit check', 'Stylist kiểm tra form, chiều dài tà và phụ kiện đi kèm.'],
  ['local_shipping', 'White glove', 'Giao nhận tận nơi cho gala, cưới hỏi và sự kiện tối.'],
];

export default function EventsPage({ onAddToCart, onNavigate }) {
  const { costumes: eventProducts, isLoading, error } = useCatalogCostumes('events');

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <EventsHero onNavigate={onNavigate} />
      <EventServicesSection services={eventServices} />

      <section id="event-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <EventsSidebar occasions={occasions} silhouettes={silhouettes} rentalWindows={rentalWindows} />
          </aside>

          <div className="md:col-span-9">
            <EventsCollectionHeader isLoading={isLoading} error={error} productCount={eventProducts.length} />

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {eventProducts.map((product, index) => (
                <CollectionProductCard
                  key={product.name}
                  product={product}
                  index={index}
                  onAddToCart={onAddToCart}
                  buttonInsetClassName="inset-x-4 bottom-4"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
