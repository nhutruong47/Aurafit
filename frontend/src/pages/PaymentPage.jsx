import { useEffect, useMemo, useRef, useState } from 'react';
import PaymentFormSections from '../components/payment/PaymentFormSections';
import PaymentHeader from '../components/payment/PaymentHeader';
import PaymentSummary from '../components/payment/PaymentSummary';
import { fetchOrderDetail } from '../services/rentalOrderService';
import { createPayment, getPaymentStatus, testWebhookPayment } from '../services/paymentService';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { formatCurrency } from '../utils/formatCurrency';
import { fallbackCostumeImage as fallbackProductImage } from '../utils/costumeUtils';
import { useToastStore } from '../store/useToastStore';

const PAYMENT_STATUS_POLL_MS = 10000;

const statusLabels = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

export default function PaymentPage({ cartItems = [], onNavigate }) {
  const { pendingOrderId, pendingOrderIds, pendingSessionAmount, hydratePendingOrderId } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [paymentInit, setPaymentInit] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [countdown, setCountdown] = useState(PAYMENT_STATUS_POLL_MS / 1000);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const pollIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const isMountedRef = useRef(true);

  // Hydrate pendingOrderId from localStorage on mount
  useEffect(() => {
    hydratePendingOrderId();
    setIsInitialized(true);
  }, [hydratePendingOrderId]);

  // Load order details
  useEffect(() => {
    if (!pendingOrderId || !pendingOrderIds || pendingOrderIds.length === 0) {
      setOrder(null);
      setOrders([]);
      setPaymentInit(null);
      setPaymentStatus(null);
      setIsLoadingOrder(false);
      return undefined;
    }

    let isMounted = true;

    setIsLoadingOrder(true);
    setPaymentError('');
    setPaymentInit(null);
    setPaymentStatus(null);

    Promise.all(pendingOrderIds.map(id => fetchOrderDetail(id)))
      .then((orderDataArray) => {
        if (!isMounted) return;
        const validOrders = orderDataArray.filter(Boolean);
        setOrders(validOrders);
        const primaryOrder = validOrders.find(o => o.id === pendingOrderId) || validOrders[0];
        setOrder(primaryOrder || null);
        setPaymentStatus(primaryOrder?.status || null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setPaymentError(error.message || 'Không thể tải thông tin đơn hàng. 🥺');
      })
      .finally(() => {
        if (isMounted) setIsLoadingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pendingOrderId, pendingOrderIds]);

  const clearPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  // Start polling payment status after QR is generated
  useEffect(() => {
    if (!paymentInit || !pendingOrderId) {
      clearPolling();
      return undefined;
    }

    isMountedRef.current = true;

    const checkStatus = async () => {
      if (!isMountedRef.current || !pendingOrderId) return;
      setIsCheckingStatus(true);

      try {
        const statusData = await getPaymentStatus(pendingOrderId);
        if (!isMountedRef.current) return;

        setPaymentStatus(statusData?.status || null);

        if (statusData?.status === 'PAID') {
          clearPolling();
          onNavigate?.('success');
        }
      } catch {
        // Silent fail - will retry
      } finally {
        if (isMountedRef.current) setIsCheckingStatus(false);
      }
    };

    // Countdown timer for 15-minute expiration
    const expireTime = new Date(order?.createdAt || Date.now()).getTime() + 15 * 60 * 1000;
    
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, expireTime - now);
      
      if (diff === 0 && isMountedRef.current) {
        clearPolling();
        useToastStore.getState().addToast('Đơn hàng này đã hết hạn thanh toán mất rồi bạn ơi! 🥺', 'error');
        onNavigate?.('orders');
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    // Polling every 10s
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, PAYMENT_STATUS_POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearPolling();
    };
  }, [paymentInit, pendingOrderId, onNavigate, order]);

  const items = useMemo(() => {
    if (orders?.length > 0) {
      const allDetails = orders.flatMap(o => o.details || []);
      const hasMultipleTimeframes = orders.length > 1 && new Set(orders.map(o => `${o.rentalStartDate}_${o.rentalEndDate}`)).size > 1;
      
      const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
      };

      return allDetails.map((detail) => {
        const datesStr = hasMultipleTimeframes && detail.rentalStartDate && detail.rentalEndDate 
          ? `${formatDate(detail.rentalStartDate)} - ${formatDate(detail.rentalEndDate)}` 
          : null;
          
        return {
          id: detail.id,
          name: detail.costumeName || 'Trang phục AuraFit',
          meta: [detail.skuCode || detail.sku, detail.size, detail.color, datesStr].filter(Boolean).join(' • ') || 'Sản phẩm thuê',
          price: formatCurrency(detail.subtotal || detail.rentalPrice || 0),
          image: fallbackProductImage,
        };
      });
    }
    return cartItems;
  }, [cartItems, orders]);

  const summary = useMemo(() => {
    if (orders?.length > 0) {
      const rentalSubtotal = orders.reduce((sum, o) => sum + Number(o.totalRentalPrice || 0), 0);
      const discountTotal = orders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
      const deliveryFee = orders.reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);
      const refundableDeposit = orders.reduce((sum, o) => sum + Number(o.totalDeposit || 0), 0);
      const orderTotal = Number(pendingSessionAmount || orders.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0));
      return { rentalSubtotal, discountTotal, deliveryFee, refundableDeposit, orderTotal };
    }
    return {
      rentalSubtotal: 0,
      discountTotal: 0,
      deliveryFee: 0,
      refundableDeposit: 0,
      orderTotal: 0,
    };
  }, [orders, pendingSessionAmount]);

  const handleCompletePayment = async () => {
    if (!pendingOrderId) {
      setPaymentError('Không tìm thấy đơn hàng. Vui lòng quay lại bước checkout.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      const paymentPayload = await createPayment({ orderId: pendingOrderId });
      if (isMountedRef.current) {
        setPaymentInit(paymentPayload || null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setPaymentError(error.message || 'Không thể tạo thanh toán. 🥺');
      }
    } finally {
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!pendingOrderId || !paymentInit) return;

    setIsTestingWebhook(true);
    try {
      await testWebhookPayment({
        orderId: pendingOrderId,
        paymentContent: paymentInit.paymentContent,
        amount: paymentInit.amount,
      });

      // Check status immediately after webhook
      const statusData = await getPaymentStatus(pendingOrderId);
      setPaymentStatus(statusData?.status || null);

      if (statusData?.status === 'PAID') {
        clearPolling();
        onNavigate?.('success');
      }
    } catch {
      // webhook failed, will retry via polling
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'CONFIRMED';
  const statusLabel = statusLabels[paymentStatus] || statusLabels[paymentStatus] || paymentStatus;

  // Show redirect prompt if no pendingOrderId after hydration
  console.log("Session Orders:", orders, "Session Amount:", summary.orderTotal);

  if (isInitialized && !pendingOrderId) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
        <PaymentHeader onNavigate={onNavigate} />
        <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-16 md:px-20 md:pb-40">
          <div className="mx-auto max-w-xl py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-[#ccc]">receipt_long</span>
            <h1 className="mt-6 font-serif text-3xl italic">Không tìm thấy đơn hàng</h1>
            <p className="mt-4 text-sm text-[#5f5e5e]">
              Vui lòng quay lại bước checkout để tạo đơn thuê trước khi thanh toán.
            </p>
            <button
              onClick={() => onNavigate?.('checkout')}
              className="mt-8 bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
            >
              Quay lại giỏ hàng
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <PaymentHeader onNavigate={onNavigate} />

      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-16 md:px-20 md:pb-40">
        <header className="mb-16 animate-[fadeIn_0.8s_ease-out_forwards]">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
            Thanh toán đơn thuê
          </p>
          <h1 className="font-serif text-[40px] font-normal italic leading-tight md:text-[64px]">
            {orders.length > 1 
              ? 'Mã ' + orders.map(o => `ARF${String(o.id).padStart(4, '0')}`).join(', ')
              : `Mã ARF${String(order?.id || pendingOrderId || '----').padStart(4, '0')}`
            }
          </h1>
        </header>

        {paymentError && !isLoadingOrder && (
          <div className="mb-8 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
            {paymentError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
          <section className="space-y-16 lg:col-span-8">
            {isLoadingOrder ? (
              <div className="space-y-8">
                <div className="h-48 animate-pulse rounded border border-[#e8e2e3] bg-white" />
                <div className="h-48 animate-pulse rounded border border-[#e8e2e3] bg-white" />
                <div className="h-48 animate-pulse rounded border border-[#e8e2e3] bg-white" />
              </div>
            ) : (
              <PaymentFormSections
                order={order}
                paymentInit={paymentInit}
                isPaid={isPaid}
                paymentStatus={paymentStatus}
                statusLabel={statusLabel}
                isCheckingStatus={isCheckingStatus}
                countdown={countdown}
              />
            )}
          </section>

          <aside className="lg:col-span-4">
            <PaymentSummary
              items={items}
              summary={summary}
              isLoading={isLoadingOrder}
              paymentError={paymentError && !isLoadingOrder ? paymentError : ''}
              paymentInit={paymentInit}
              isSubmitting={isSubmitting}
              isPaid={isPaid}
              onCompletePayment={handleCompletePayment}
              onViewOrders={() => onNavigate?.('orders')}
              onTestWebhook={handleTestWebhook}
              isTestingWebhook={isTestingWebhook}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
