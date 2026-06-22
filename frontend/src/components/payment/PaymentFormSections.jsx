// Cac section form cho dia chi, giao hang va phuong thuc thanh toan.
import { deliveryOptions } from './paymentData';
import { useCheckoutStore } from '../../store/useCheckoutStore';

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

export default function PaymentFormSections({
  delivery,
  paymentMethod,
  onDeliveryChange,
  onPaymentMethodChange,
}) {
  const { pendingOrderId } = useCheckoutStore();
  const displayOrderId = pendingOrderId || '----';
  return (
    <div className="space-y-16 lg:max-w-3xl">
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
              onClick={() => onDeliveryChange(option.id)}
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
              onClick={() => onPaymentMethodChange(method.id)}
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
            <p className="font-serif text-3xl italic">RO-{String(displayOrderId).padStart(4, '0')}</p>
            <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
              Thanh toán thành công sẽ tạo Payment status PAID và chuyển đơn sang PENDING_CONFIRMATION.
            </p>
          </div>
          {paymentMethod === 'BANKING' ? (
            <div className="border border-[#cfc4c5] bg-[#f7f7f7] p-5 text-sm leading-7">
              <p><strong>Ngân hàng:</strong> AuraFit Demo Bank</p>
              <p><strong>Số tài khoản:</strong> 1900 2026 888</p>
              <p><strong>Nội dung:</strong> AURAFIT RO{String(displayOrderId).padStart(4, '0')}</p>
            </div>
          ) : (
            <div className="border border-[#cfc4c5] bg-[#f7f7f7] p-5 text-sm leading-7">
              <p><strong>Cổng thanh toán:</strong> VNPAY sandbox</p>
              <p><strong>Mã giao dịch:</strong> Tạo từ backend sau khi xác nhận.</p>
            </div>
          )}
        </div>
      </CheckoutSection>
    </div>
  );
}
