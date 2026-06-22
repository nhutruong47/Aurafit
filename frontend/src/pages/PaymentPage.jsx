import { useEffect, useMemo, useState } from 'react';
import PaymentFormSections from '../components/payment/PaymentFormSections';
import PaymentHeader from '../components/payment/PaymentHeader';
import PaymentSummary from '../components/payment/PaymentSummary';
import { logUserInteraction } from '../services/interactionsService';
import { fetchOrderDetail } from '../services/rentalOrderService';
import { createPayment } from '../services/paymentService';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { formatCurrency } from '../utils/formatCurrency';
import { fallbackProductImage } from '../utils/productMapper';

export default function PaymentPage({ cartItems = [], currentUser, onNavigate }) {
  const { pendingOrderId } = useCheckoutStore();
  const [delivery, setDelivery] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [order, setOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  useEffect(() => {
    if (!pendingOrderId) {
      setOrder(null);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingOrder(true);
    setPaymentError('');

    fetchOrderDetail(pendingOrderId)
      .then((orderData) => {
        if (!isMounted) return;
        setOrder(orderData || null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setPaymentError(error.message || 'Khong the tai thong tin don hang.');
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
        name: detail.costumeName || 'Trang phuc AuraFit',
        meta: [detail.sku, detail.size, detail.color].filter(Boolean).join(' • ') || 'Rental item',
        price: formatCurrency(detail.subtotal || 0),
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
      setPaymentError('Khong tim thay don hang. Vui long quay lai buoc checkout.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      await createPayment({ orderId: pendingOrderId, method: paymentMethod });

      if (currentUser?.id) {
        await Promise.allSettled(
          items
            .filter((item) => item.id)
            .map((item) =>
              logUserInteraction({
                userId: currentUser.id,
                actionType: 'PURCHASE',
                targetType: 'COSTUME',
                targetId: item.id,
                metadata: JSON.stringify({
                  category: item.rawCategory || item.category,
                  subcategory: item.subcategory,
                  tag: item.tag,
                }),
              })
            )
        );
      }

      onNavigate?.('success');
    } catch (error) {
      setPaymentError(error.message || 'Khong the tao thanh toan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <PaymentHeader onNavigate={onNavigate} />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-16 px-5 py-16 md:px-20 lg:flex-row lg:gap-20">
        <PaymentFormSections
          delivery={delivery}
          paymentMethod={paymentMethod}
          onDeliveryChange={setDelivery}
          onPaymentMethodChange={setPaymentMethod}
        />
        <PaymentSummary
          items={items}
          summary={summary}
          isLoading={isLoadingOrder}
          paymentError={paymentError}
          isSubmitting={isSubmitting}
          onCompletePayment={handleCompletePayment}
        />
      </main>
    </div>
  );
}
