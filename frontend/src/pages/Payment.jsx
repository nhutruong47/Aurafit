import { useState } from 'react';
import { createPayment, logUserInteraction } from '../services/api';

const fallbackItems = [
  {
    name: 'Couture Gala Gown',
    meta: 'Event Rental | 4 Days',
    price: '10,000,000₫',
    image:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=85',
  },
];

const deliveryOptions = [
  {
    id: 'standard',
    title: 'Standard Premiere (Free)',
    price: '0₫',
    copy: '3-5 business days. Sustainable archival packaging included. Free for orders over 1,000,000₫.',
  },
  {
    id: 'express',
    title: 'Express Elite',
    price: '250,000₫',
    copy: 'Delivery within 2 hours. Priority handling and premium packaging.',
  },
  {
    id: 'concierge',
    title: 'White-Glove Concierge',
    price: '3,000,000₫',
    copy: 'Next-day arrival. On-site fitting and immediate alterations if required. Professional steaming and setup.',
  },
];

export default function Payment({ cartItems = [], currentUser, onNavigate }) {
  const [delivery, setDelivery] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const items = cartItems.length ? cartItems : fallbackItems;
  const demoOrderId = 1;
  const payableAmount = 16000000;

  const handleCompletePayment = async () => {
    setIsSubmitting(true);
    setPaymentError('');

    try {
      await createPayment({
        rentalOrderId: demoOrderId,
        amount: payableAmount,
        paymentType: 'DEPOSIT',
        paymentMethod,
      });
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
      <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9] px-5 md:px-20">
        <button onClick={() => onNavigate?.('checkout')} className="group flex items-center gap-2">
          <span className="material-symbols-outlined text-[#999999] transition group-hover:text-black">arrow_back</span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e]">Back to Store</span>
        </button>
        <button onClick={() => onNavigate?.('home')} className="font-serif text-3xl uppercase tracking-[0.2em] text-black">
          AuraFit
        </button>
        <div className="hidden items-center gap-3 md:flex">
          <span className="material-symbols-outlined text-[#99854e]">lock</span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Secure Checkout</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1440px] flex-col gap-16 px-5 py-16 md:px-20 lg:flex-row lg:gap-20">
        <div className="flex-grow space-y-16 lg:max-w-3xl">
          <CheckoutSection number="01" title="Shipping Address" meta="Required">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
              <TextField label="Full Name" placeholder="ALEXANDER VOGUE" full />
              <TextField label="Address Line 1" placeholder="72 FIFTH AVENUE" full />
              <TextField label="City" placeholder="NEW YORK" />
              <TextField label="Postal Code" placeholder="10011" />
            </div>
          </CheckoutSection>

          <GoldDivider />

          <CheckoutSection number="02" title="Delivery Mode" meta="Service Level">
            <div className="space-y-4">
              {deliveryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDelivery(option.id)}
                  className={`relative flex w-full cursor-pointer items-start border p-6 text-left transition ${
                    delivery === option.id ? 'border-[#99854e] bg-[#f7f7f7]' : 'border-[#cfc4c5] hover:border-[#99854e]'
                  }`}
                >
                  <span
                    className={`mt-1 h-4 w-4 rounded-full border ${
                      delivery === option.id ? 'border-[#99854e] bg-[#99854e]' : 'border-[#999999]'
                    }`}
                  />
                  <span className="ml-6 flex-grow">
                    <span className="mb-1 flex items-center justify-between gap-4">
                      <span className={`text-[12px] font-semibold uppercase tracking-[0.2em] ${delivery === option.id ? 'text-[#99854e]' : 'text-black'}`}>
                        {option.title}
                      </span>
                      <span>{option.price}</span>
                    </span>
                    <span className="block text-sm leading-6 text-[#999999]">{option.copy}</span>
                  </span>
                </button>
              ))}
            </div>
          </CheckoutSection>

          <GoldDivider />

          <CheckoutSection number="03" title="Secure Payment" icon="verified_user">
            <div className="mb-10 flex gap-4">
              {[
                { id: 'VNPAY', label: 'VNPAY' },
                { id: 'BANKING', label: 'Banking' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex-1 border py-4 text-[12px] font-semibold uppercase tracking-[0.2em] transition ${
                    paymentMethod === method.id ? 'border-black bg-black text-white' : 'border-[#cfc4c5] hover:border-black'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
            <div className="space-y-6">
              <div className="border border-[#cfc4c5] bg-white p-5">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Rental Order</p>
                <p className="font-serif text-3xl italic">RO-{String(demoOrderId).padStart(4, '0')}</p>
                <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                  Thanh toan thanh cong se tao Payment status PAID va chuyen don sang PENDING_CONFIRMATION.
                </p>
              </div>
              {paymentMethod === 'BANKING' ? (
                <div className="border border-[#cfc4c5] bg-[#f7f7f7] p-5 text-sm leading-7">
                  <p><strong>Ngan hang:</strong> AuraFit Demo Bank</p>
                  <p><strong>So tai khoan:</strong> 1900 2026 888</p>
                  <p><strong>Noi dung:</strong> AURAFIT RO{String(demoOrderId).padStart(4, '0')}</p>
                </div>
              ) : (
                <div className="border border-[#cfc4c5] bg-[#f7f7f7] p-5 text-sm leading-7">
                  <p><strong>Cong thanh toan:</strong> VNPAY sandbox</p>
                  <p><strong>Ma giao dich:</strong> Tao tu backend sau khi xac nhan.</p>
                </div>
              )}
            </div>
          </CheckoutSection>
        </div>

        <aside className="lg:w-96">
          <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8">
            <h3 className="mb-8 border-b border-[#cfc4c5] pb-4 font-serif text-3xl font-normal">Summary</h3>
            <div className="mb-8 space-y-6">
              {items.map((item) => (
                <div key={item.cartId || item.name} className="flex gap-4">
                  <div className="h-24 w-20 overflow-hidden bg-[#eeeeee]">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.15em]">{item.name}</p>
                      <p className="text-xs uppercase tracking-tight text-[#999999]">{item.meta || 'Event Rental | 4 Days'}</p>
                    </div>
                    <p>{item.price || '$180.00'}</p>
                  </div>
                </div>
              ))}
            </div>
            <hr className="mb-8 border-[#cfc4c5]" />
            <div className="space-y-4 text-sm">
              <SummaryRow label="Rental Subtotal" value="10,000,000₫" />
              <SummaryRow label="Delivery (Standard)" value="0₫" />
              <SummaryRow label="Refundable Deposit" value="6,000,000₫" accent />
              <div className="flex justify-between border-t border-[#cfc4c5] pt-4 text-lg">
                <span className="self-center text-[12px] font-semibold uppercase tracking-[0.15em]">Order Total</span>
                <span className="font-serif text-3xl">16,000,000₫</span>
              </div>
            </div>
            {paymentError && (
              <div className="mt-6 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                {paymentError}
              </div>
            )}
            <button
              onClick={handleCompletePayment}
              disabled={isSubmitting}
              className="mt-10 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
            >
              {isSubmitting ? 'Processing Payment' : 'Complete Booking'}
            </button>
            <p className="mt-6 text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#999999]">
              By completing your order, you agree to our terms of service and damage policy.
            </p>
          </div>
        </aside>
      </main>

      <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 border-t border-[#cfc4c5] py-10 opacity-60 md:flex-row md:gap-12">
        <TrustItem icon="verified" label="Encrypted Payment" />
        <TrustItem icon="local_shipping" label="Global Concierge" />
        <TrustItem icon="history" label="Sustainable Heritage" />
      </div>
    </div>
  );
}

function CheckoutSection({ number, title, meta, icon, children }) {
  return (
    <section>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-normal italic">{number}. {title}</h2>
        {icon ? (
          <span className="material-symbols-outlined text-[#999999]">{icon}</span>
        ) : (
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{meta}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function TextField({ label, placeholder, type = 'text', full = false, tracking = 'tracking-widest' }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full border-x-0 border-t-0 border-b border-black bg-transparent px-0 py-3 uppercase ${tracking} placeholder:text-[#e2e2e2] focus:border-[#99854e] focus:outline-none focus:ring-0`}
      />
    </div>
  );
}

function GoldDivider() {
  return <hr className="h-px border-none bg-gradient-to-r from-transparent via-[#99854e] to-transparent" />;
}

function SummaryRow({ label, value, accent = false }) {
  return (
    <div className={`flex justify-between ${accent ? 'font-medium text-[#99854e]' : ''}`}>
      <span className="text-[#5f5e5e]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TrustItem({ icon, label }) {
  return (
    <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.15em]">
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </span>
  );
}
