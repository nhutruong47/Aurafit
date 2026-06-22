import { useEffect, useMemo, useState } from 'react';
import OrderSuccessFooter from '../components/order-success/OrderSuccessFooter';
import OrderSuccessHeader from '../components/order-success/OrderSuccessHeader';
import OrderSuccessHero from '../components/order-success/OrderSuccessHero';
import OrderSelectionSection from '../components/order-success/OrderSelectionSection';
import OrderSuccessSidebar from '../components/order-success/OrderSuccessSidebar';
import OrderSuccessStorySection from '../components/order-success/OrderSuccessStorySection';
import { footerColumns, mobileNavLinks, navLinks, storyLinks } from '../components/order-success/orderSuccessData';
import { fetchOrderDetail } from '../services/api';
import { useCheckoutStore } from '../store/useCheckoutStore';

const fallbackItemImage =
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=85';

const formatDateRange = (start, end) => {
  if (!start || !end) return 'Ngày thuê đang cập nhật';
  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };
  return `${formatDate(start)} → ${formatDate(end)}`;
};

export default function OrderSuccess({ cartItems = [], onNavigate }) {
  const { pendingOrderId, clearPendingOrderId } = useCheckoutStore();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pendingOrderId) {
      setOrder(null);
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchOrderDetail(pendingOrderId)
      .then((orderData) => {
        if (!isMounted) return;
        setOrder(orderData || null);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Không thể tải chi tiết đơn hàng vừa tạo.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pendingOrderId]);

  const items = useMemo(() => {
    if (order?.details?.length) {
      return order.details.map((detail) => ({
        name: detail.costumeName || 'Trang phục AuraFit',
        size: detail.size ? `Size: ${detail.size}${detail.color ? ` • ${detail.color}` : ''}` : detail.sku || 'Trang phục thuê',
        image: fallbackItemImage,
        rental: formatDateRange(order.rentalStartDate, order.rentalEndDate),
        sku: detail.sku,
        subtotal: detail.subtotal,
      }));
    }

    return (cartItems || []).map((item) => ({
      name: item.name,
      size: item.size || item.meta || 'Trang phục thuê',
      image: item.image || fallbackItemImage,
      rental: 'Ngày thuê đang cập nhật',
    }));
  }, [order, cartItems]);

  const totalLabel = useMemo(() => {
    if (!order) return null;
    if (order.finalAmount) return order.finalAmount;
    if (order.totalRentalPrice) return order.totalRentalPrice;
    return null;
  }, [order]);

  const handleContinueShopping = () => {
    clearPendingOrderId();
    onNavigate?.('home');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <OrderSuccessHeader navLinks={navLinks} onNavigate={onNavigate} />

      <main className="pt-20">
        <OrderSuccessHero
          orderId={order?.id || pendingOrderId}
          status={order?.status}
          totalLabel={totalLabel}
          onContinue={handleContinueShopping}
        />

        {error && (
          <div className="mx-5 mt-10 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a] md:mx-20">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mx-5 py-20 text-center text-sm text-[#5f5e5e] md:mx-20">Đang tải chi tiết đơn hàng...</div>
        ) : (
          <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-20 md:grid-cols-12 md:px-20">
            <OrderSelectionSection items={items} />
            <OrderSuccessSidebar order={order} />
          </section>
        )}

        <OrderSuccessStorySection links={storyLinks} />
      </main>

      <OrderSuccessFooter footerColumns={footerColumns} mobileNavLinks={mobileNavLinks} onNavigate={onNavigate} />
    </div>
  );
}
