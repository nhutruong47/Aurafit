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
  isPaid = false,
  onCompletePayment,
  onViewOrders,
  onTestWebhook,
  isTestingWebhook = false,
}) {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  return (
    <>
      <aside className="lg:w-96">
        <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8">
          <h3 className="mb-8 border-b border-[#cfc4c5] pb-4 font-serif text-3xl font-normal">
            Tóm tắt đơn thuê
          </h3>

          {/* Items list */}
          <div className="mb-8 space-y-6">
            {isLoading ? (
              <p className="text-sm text-[#5f5e5e]">Đang tải thông tin đơn hàng...</p>
            ) : items.length > 0 ? (
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
                        {item.meta || 'Sản phẩm thuê'}
                      </p>
                    </div>
                    <p>{item.price || formatCurrency(0)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#5f5e5e]">Chưa có sản phẩm nào.</p>
            )}
          </div>

          <hr className="mb-8 border-[#cfc4c5]" />

          {/* Pricing breakdown */}
          <div className="space-y-4 text-sm">
            <SummaryRow label="Tiền thuê" value={formatCurrency(summary?.rentalSubtotal || 0)} />
            {summary?.discountTotal > 0 && (
              <SummaryRow
                label="Ưu đãi chương trình"
                value={`- ${formatCurrency(summary.discountTotal)}`}
                accent
              />
            )}
            <SummaryRow label="Phí giao hàng" value={formatCurrency(summary?.deliveryFee || 0)} />
            <SummaryRow
              label="Tiền đặt cọc (Hoàn trả)"
              value={formatCurrency(summary?.refundableDeposit || 0)}
              accent
            />
            <div className="flex justify-between border-t border-[#cfc4c5] pt-4 text-lg">
              <span className="self-center text-[12px] font-semibold uppercase tracking-[0.15em]">
                Tổng thanh toán
              </span>
              <span className="font-serif text-3xl">{formatCurrency(summary?.orderTotal || 0)}</span>
            </div>
          </div>

          {/* Error */}
          {paymentError && (
            <div className="mt-6 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
              {paymentError}
            </div>
          )}

          {/* QR section - shown when paymentInit is available */}
          {paymentInit && !isPaid && (
            <div className="mt-6 border border-[#99854e]/30 bg-[#f8f4e8] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#725f2f]">
                Mã thanh toán
              </p>
              {paymentInit.qrImageUrl ? (
                <img
                  src={paymentInit.qrImageUrl}
                  alt="Mã VietQR thanh toán"
                  className="mx-auto mb-4 h-52 w-52 rounded-lg border border-[#cfc4c5] bg-white object-contain p-2"
                />
              ) : (
                <div className="mx-auto mb-4 flex h-52 w-52 items-center justify-center rounded-lg border border-[#cfc4c5] bg-white">
                  <span className="material-symbols-outlined text-6xl text-[#ccc]">qr_code</span>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#725f2f]">Nội dung:</span>
                  <span className="font-mono font-semibold">{paymentInit.paymentContent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#725f2f]">Số tiền:</span>
                  <span className="font-semibold text-[#99854e]">{formatCurrency(paymentInit.amount || 0)}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#5f5e5e]">
                Sau khi chuyển khoản thành công, hệ thống sẽ đối soát tự động và cập nhật trạng thái đơn hàng trong 10 giây.
              </p>
              {/* DEV: Test webhook button - only visible on localhost */}
              {isLocalhost && onTestWebhook && (
                <button
                  onClick={onTestWebhook}
                  disabled={isTestingWebhook}
                  className="mt-4 w-full border-2 border-dashed border-[#99854e] bg-[#fdfbf5] py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#99854e] transition hover:border-[#725f2f] hover:bg-[#f5f0e0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTestingWebhook ? 'Đang xử lý...' : '🧪 Test Thanh Toán (Dev Only)'}
                </button>
              )}
            </div>
          )}

          {/* Paid state */}
          {isPaid && (
            <div className="mt-6 border border-[#2e7d32]/30 bg-[#f1f8e9] p-4 text-center">
              <span className="material-symbols-outlined text-4xl text-[#2e7d32]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <p className="mt-2 text-sm font-semibold text-[#2e7d32]">Thanh toán thành công!</p>
              <p className="mt-1 text-xs text-[#5f5e5e]">Cảm ơn bạn đã sử dụng dịch vụ AuraFit.</p>
            </div>
          )}

          {/* Action button */}
          {!isPaid && (
            <button
              onClick={onCompletePayment}
              disabled={isSubmitting || isLoading}
              className="mt-8 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
            >
              {isSubmitting
                ? 'Đang tạo mã thanh toán...'
                : paymentInit
                ? 'Tạo lại mã QR'
                : 'Tạo mã QR thanh toán'}
            </button>
          )}

          {onViewOrders && (
            <button
              onClick={onViewOrders}
              className="mt-4 w-full border border-black py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
            >
              Xem chi tiết đơn hàng
            </button>
          )}

          <p className="mt-6 text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#999999]">
            Tạo QR không đồng nghĩa đơn đã thanh toán. Trạng thái đơn sẽ được cập nhật tự động sau khi đối soát giao dịch.
          </p>
        </div>
      </aside>

      {/* Trust row */}
      <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 border-t border-[#cfc4c5] py-10 opacity-60 md:flex-row md:gap-12">
        <TrustItem icon="verified" label="Thanh toán mã hóa" />
        <TrustItem icon="local_shipping" label="Hỗ trợ giao nhận" />
        <TrustItem icon="history" label="Trải nghiệm bền vững" />
      </div>
    </>
  );
}
