import OrderSuccessFooter from '../components/order-success/OrderSuccessFooter';
import OrderSuccessHeader from '../components/order-success/OrderSuccessHeader';
import OrderSuccessHero from '../components/order-success/OrderSuccessHero';
import OrderSelectionSection from '../components/order-success/OrderSelectionSection';
import OrderSuccessSidebar from '../components/order-success/OrderSuccessSidebar';
import OrderSuccessStorySection from '../components/order-success/OrderSuccessStorySection';
import {
  footerColumns,
  getOrderSuccessItems,
  mobileNavLinks,
  navLinks,
  storyLinks,
} from '../components/order-success/orderSuccessData';

export default function OrderSuccess({ cartItems = [], onNavigate }) {
  const items = getOrderSuccessItems(cartItems);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <OrderSuccessHeader navLinks={navLinks} onNavigate={onNavigate} />

      <main className="pt-20">
        <OrderSuccessHero />

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-20 md:grid-cols-12 md:px-20">
          <OrderSelectionSection items={items} />
          <OrderSuccessSidebar />
        </section>

        <OrderSuccessStorySection links={storyLinks} />
      </main>

      <OrderSuccessFooter footerColumns={footerColumns} mobileNavLinks={mobileNavLinks} onNavigate={onNavigate} />
    </div>
  );
}
