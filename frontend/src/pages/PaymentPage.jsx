import { useEffect, useMemo, useRef, useState } from 'react';
import PaymentFormSections from '../components/payment/PaymentFormSections';
import PaymentHeader from '../components/payment/PaymentHeader';
import PaymentSummary from '../components/payment/PaymentSummary';
import { fetchOrderDetail } from '../services/rentalOrderService';
import { createPayment, getPaymentStatus } from '../services/paymentService';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { formatCurrency } from '../utils/formatCurrency';
import { fallbackProductImage } from '../utils/productMapper';

const PAYMENT_STATUS_POLL_MS = 10000;

const statusLabels = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

export default function PaymentPage({ cartItems = [], onNavigate }) {
  const { pendingOrderId } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [order, setOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [paymentInit, setPaymentInit] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [countdown, setCountdown] = useState(PAYMENT_STATUS_POLL_MS / 1000);
  const pollIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const isMountedRef = useRef(true);

  // Load order detail
  useEffect(() => {
    if (!pendingOrderId) {
      setOrder(null);
      setPaymentInit(null);
      setPaymentStatus(null);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingOrder(true);
    setPaymentError('');
    setPaymentInit(null);
    setPaymentStatus(null);

    fetchOrderDetail(pendingOrderId)
      .then((orderData) => {
        if (!isMounted) return;
        setOrder(orderData || null);
        setPaymentStatus(orderData?.status || null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setPaymentError(error.message || 'Không thể tải thông tin đơn hàng.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pendingOrderId]);

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

    // Countdown timer
    setCountdown(PAYMENT_STATUS_POLL_MS / 1000);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return PAYMENT_STATUS_POLL_MS / 1000;
        return prev - 1;
      });
    }, 1000);

    // Polling every 10s
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, PAYMENT_STATUS_POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearPolling();
    };
  }, [paymentInit, pendingOrderId, onNavigate]);

  const clearPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const items = useMemo(() => {
    if (order?.details?.length) {
      return order.details.map((detail) => ({
        id: detail.id,
        name: detail.costumeName || 'Trang phục AuraFit',
        meta: [detail.skuCode || detail.sku, detail.size, detail.color].filter(Boolean).join(' • ') || 'Sản phẩm thuê',
        price: formatCurrency(detail.subtotal || detail.rentalPrice || 0),
        image: fallbackProductImage,
      }));
    }
    return cartItems;
  }, [cartItems, order]);

  const summary = useMemo(
    () => ({
      rentalSubtotal: Number(order?.totalRentalPrice || 0),
      deliveryFee: 0,
      refundableDeposit: Number(order?.totalDeposit || 0),
      orderTotal: Number(order?.finalAmount || 0) + Number(order?.totalDeposit || 0),
    }),
    [order]
  );

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
        setPaymentError(error.message || 'Không thể tạo thanh toán.');
      }
    } finally {
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'CONFIRMED';
  const statusLabel = statusLabels[paymentStatus] || statusLabels[paymentStatus] || paymentStatus;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <PaymentHeader onNavigate={onNavigate} />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-16 px-5 py-16 md:px-20 lg:flex-row lg:gap-20">
        <PaymentFormSections
          order={order}
          paymentInit={paymentInit}
          isPaid={isPaid}
          paymentStatus={paymentStatus}
          statusLabel={statusLabel}
          isCheckingStatus={isCheckingStatus}
          countdown={countdown}
        />
        <PaymentSummary
          items={items}
          summary={summary}
          isLoading={isLoadingOrder}
          paymentError={paymentError}
          paymentInit={paymentInit}
          isSubmitting={isSubmitting}
          isPaid={isPaid}
          onCompletePayment={handleCompletePayment}
          onViewOrders={() => onNavigate?.('orders')}
        />
      </main>
    </div>
  );
}
