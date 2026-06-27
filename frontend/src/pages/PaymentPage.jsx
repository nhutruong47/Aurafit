import { useEffect, useMemo, useState } from 'react';
import PaymentFormSections from '../components/payment/PaymentFormSections';
import PaymentHeader from '../components/payment/PaymentHeader';
import PaymentSummary from '../components/payment/PaymentSummary';
import { fetchOrderDetail } from '../services/rentalOrderService';
import { createPayment } from '../services/paymentService';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { formatCurrency } from '../utils/formatCurrency';
import { fallbackProductImage } from '../utils/productMapper';

export default function PaymentPage({ cartItems = [], onNavigate }) {
  const { pendingOrderId } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [order, setOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [paymentInit, setPaymentInit] = useState(null);

  useEffect(() => {
    if (!pendingOrderId) {
      setOrder(null);
      setPaymentInit(null);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingOrder(true);
    setPaymentError('');
    setPaymentInit(null);

    fetchOrderDetail(pendingOrderId)
      .then((orderData) => {
        if (!isMounted) return;
        setOrder(orderData || null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setPaymentError(error.message || 'Không thể tải thông tin đơn hàng.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOrder(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pendingOrderId]);

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
      setPaymentInit(paymentPayload || null);
    } catch (error) {
      setPaymentError(error.message || 'Không thể tạo thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <PaymentHeader onNavigate={onNavigate} />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-16 px-5 py-16 md:px-20 lg:flex-row lg:gap-20">
        <PaymentFormSections order={order} paymentInit={paymentInit} />
        <PaymentSummary
          items={items}
          summary={summary}
          isLoading={isLoadingOrder}
          paymentError={paymentError}
          paymentInit={paymentInit}
          isSubmitting={isSubmitting}
          onCompletePayment={handleCompletePayment}
          onViewOrders={() => onNavigate?.('orders')}
        />
      </main>
    </div>
  );
}
