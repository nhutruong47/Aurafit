import { useState } from 'react';
import PaymentFormSections from '../components/payment/PaymentFormSections';
import PaymentHeader from '../components/payment/PaymentHeader';
import PaymentSummary from '../components/payment/PaymentSummary';
import { fallbackItems } from '../components/payment/paymentData';
import { createPayment, logUserInteraction } from '../services/api';
import { useCheckoutStore } from '../store/useCheckoutStore';

export default function Payment({ cartItems = [], currentUser, onNavigate }) {
  const { pendingOrderId, clearPendingOrderId } = useCheckoutStore();
  const [delivery, setDelivery] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const items = cartItems.length ? cartItems : fallbackItems;

  const handleCompletePayment = async () => {
    if (!pendingOrderId) {
      setPaymentError('Không tìm thấy đơn hàng. Vui lòng quay lại bước checkout.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      await createPayment({ rentalOrderId: pendingOrderId });

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

      clearPendingOrderId();
      onNavigate?.('success');
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
