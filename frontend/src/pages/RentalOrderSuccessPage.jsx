import { useEffect, useMemo, useState } from 'react';
import OrderSuccessHero from '../components/order-success/OrderSuccessHero';
import OrderSelectionSection from '../components/order-success/OrderSelectionSection';
import OrderSuccessSidebar from '../components/order-success/OrderSuccessSidebar';
import OrderSuccessStorySection from '../components/order-success/OrderSuccessStorySection';
import { fetchOrderDetail } from '../services/rentalOrderService';
import { useCheckoutStore } from '../store/useCheckoutStore';

const fallbackItemImage =
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=85';
const storyLinks = ['Instagram', 'Bộ ảnh'];

const formatDateRange = (start, end) => {
  if (!start || !end) return 'Ngày thuê đang cập nhật';
  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };
  return `${formatDate(start)} → ${formatDate(end)}`;
};

export default function RentalOrderSuccessPage({ cartItems = [], onNavigate }) {
  const { pendingOrderId, clearPendingOrderId, hydratePendingOrderId } = useCheckoutStore();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contextOrderId, setContextOrderId] = useState(null);
  const [isContextReady, setIsContextReady] = useState(false);

  useEffect(() => {
    // Capture the order that opened this page. Clearing it when the customer
    // continues shopping must not turn the current page into an error state.
    setContextOrderId(hydratePendingOrderId() || null);
    setIsContextReady(true);
  }, [hydratePendingOrderId]);

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
        setError(requestError.message || 'Hệ thống không thể truy xuất thông tin chi tiết đơn hàng vừa tạo.');
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

  if (isContextReady && !contextOrderId) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] text-[#211E1B]">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#756536]">receipt_long</span>
          <h1 className="mt-6 font-serif text-3xl text-[#211E1B]">Không tìm thấy đơn hàng</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#6B6259]">
            Trang xác nhận này chỉ hiển thị sau khi bạn hoàn tất đặt thuê. Vui lòng kiểm tra
            lịch sử đơn hàng hoặc quay về trang chủ.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.('orders')}
              className="border border-[#3A302A] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3A302A] transition hover:bg-[#3A302A] hover:text-white"
            >
              Xem đơn hàng
            </button>
            <button
              onClick={() => onNavigate?.('home')}
              className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6259] transition hover:text-[#211E1B]"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1E8] text-[#211E1B]">
      <div className="pt-10">
        <OrderSuccessHero
          orderId={order?.id || contextOrderId}
          status={order?.status}
          totalLabel={totalLabel}
          onContinue={handleContinueShopping}
          onTrackOrder={() => onNavigate?.('orders')}
        />

        {error && (
          <div className="mx-5 mt-10 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a] md:mx-20">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mx-5 py-20 text-center text-sm text-[#6B6259] md:mx-20">Đang tải chi tiết đơn hàng...</div>
        ) : (
          <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-20 md:grid-cols-12 md:px-20">
            <OrderSelectionSection items={items} />
            <OrderSuccessSidebar order={order} />
          </section>
        )}

        <OrderSuccessStorySection links={storyLinks} />
      </div>
    </div>
  );
}
