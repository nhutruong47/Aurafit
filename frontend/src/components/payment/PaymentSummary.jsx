import { formatCurrency } from '../../utils/formatCurrency';

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

export default function PaymentSummary({
  items,
  summary,
  isLoading = false,
  paymentError,
  paymentInit,
  isSubmitting,
  onCompletePayment,
  onViewOrders,
}) {
  return (
    <>
      <aside className="lg:w-96">
        <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8">
          <h3 className="mb-8 border-b border-[#cfc4c5] pb-4 font-serif text-3xl font-normal">
            Summary
          </h3>
          <div className="mb-8 space-y-6">
            {isLoading ? (
              <p className="text-sm text-[#5f5e5e]">Dang tai thong tin don hang...</p>
            ) : (
              items.map((item) => (
                <div key={item.cartId || item.id || item.name} className="flex gap-4">
                  <div className="h-24 w-20 overflow-hidden bg-[#eeeeee]">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.15em]">
                        {item.name}
                      </p>
                      <p className="text-xs uppercase tracking-tight text-[#999999]">
                        {item.meta || 'Rental item'}
                      </p>
                    </div>
                    <p>{item.price || formatCurrency(0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <hr className="mb-8 border-[#cfc4c5]" />
          <div className="space-y-4 text-sm">
            <SummaryRow label="Rental Subtotal" value={formatCurrency(summary?.rentalSubtotal || 0)} />
            <SummaryRow label="Delivery" value={formatCurrency(summary?.deliveryFee || 0)} />
            <SummaryRow
              label="Refundable Deposit"
              value={formatCurrency(summary?.refundableDeposit || 0)}
              accent
            />
            <div className="flex justify-between border-t border-[#cfc4c5] pt-4 text-lg">
              <span className="self-center text-[12px] font-semibold uppercase tracking-[0.15em]">
                Order Total
              </span>
              <span className="font-serif text-3xl">{formatCurrency(summary?.orderTotal || 0)}</span>
            </div>
          </div>
          {paymentError && (
            <div className="mt-6 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
              {paymentError}
            </div>
          )}
          {paymentInit && (
            <div className="mt-6 border border-[#99854e]/30 bg-[#f8f4e8] p-4 text-sm text-[#5f5e5e]">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#725f2f]">
                Ma thanh toan da tao
              </p>
              {paymentInit.qrImageUrl ? (
                <img
                  src={paymentInit.qrImageUrl}
                  alt="VietQR payment"
                  className="mx-auto mb-4 h-56 w-56 border border-[#cfc4c5] bg-white object-contain p-2"
                />
              ) : null}
              <p>
                <strong>Noi dung:</strong> {paymentInit.paymentContent}
              </p>
              <p>
                <strong>So tien:</strong> {formatCurrency(paymentInit.amount || 0)}
              </p>
              <p className="mt-3 text-xs leading-6">
                Sau khi chuyen khoan thanh cong, backend se doi soat webhook va cap nhat trang thai
                don hang.
              </p>
            </div>
          )}
          <button
            onClick={onCompletePayment}
            disabled={isSubmitting || isLoading}
            className="mt-10 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
          >
            {isSubmitting ? 'Dang tao ma thanh toan' : paymentInit ? 'Tao lai ma QR' : 'Tao ma QR thanh toan'}
          </button>
          {onViewOrders && (
            <button
              onClick={onViewOrders}
              className="mt-4 w-full border border-black py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
            >
              Xem chi tiet don hang
            </button>
          )}
          <p className="mt-6 text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#999999]">
            Tao QR khong dong nghia don da thanh toan. Trang thai don se duoc cap nhat boi backend
            sau khi doi soat giao dich.
          </p>
        </div>
      </aside>

      <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 border-t border-[#cfc4c5] py-10 opacity-60 md:flex-row md:gap-12">
        <TrustItem icon="verified" label="Encrypted Payment" />
        <TrustItem icon="local_shipping" label="Global Concierge" />
        <TrustItem icon="history" label="Sustainable Heritage" />
      </div>
    </>
  );
}
