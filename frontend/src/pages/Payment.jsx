import { useState } from 'react';
import PaymentFormSections from '../components/payment/PaymentFormSections';
import PaymentHeader from '../components/payment/PaymentHeader';
import PaymentSummary from '../components/payment/PaymentSummary';
import { fallbackItems } from '../components/payment/paymentData';
import { logUserInteraction } from '../services/interactionsService';
import { createPayment } from '../services/paymentsService';
import { useCheckoutStore } from '../store/useCheckoutStore';

export default function Payment({ cartItems = [], currentUser, onNavigate }) {
  const { pendingOrderId } = useCheckoutStore();
  const [delivery, setDelivery] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const items = cartItems.length ? cartItems : fallbackItems;

  const handleCompletePayment = async () => {
    if (!pendingOrderId) {
      setPaymentError('Khong tim thay don hang. Vui long quay lai buoc checkout.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      await createPayment({ orderId: pendingOrderId });

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
          paymentError={paymentError}
          isSubmitting={isSubmitting}
          onCompletePayment={handleCompletePayment}
        />
      </main>
    </div>
  );
}
