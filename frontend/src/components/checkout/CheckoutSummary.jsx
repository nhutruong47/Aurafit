// Tong ket gia tri don thue, phi coc va hanh dong checkout.
export default function CheckoutSummary({
  summaryRows,
  formattedTotalDue,
  onNavigate,
  onProceedToCheckout,
  isSubmitting,
  submitError,
  selectedCount = 1,
}) {
  const canSubmit = selectedCount > 0 && !isSubmitting;
  return (
    <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8 shadow-sm">
      <h2 className="mb-8 font-serif text-[28px] font-normal uppercase tracking-tight">Tóm tắt đơn thuê</h2>

      <div className="space-y-6">
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-6 ${row.accent ? 'text-[#99854e]' : ''}`}
          >
            <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-current opacity-80">
              {row.label}
            </span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}

        <div className="border-t border-black pt-8">
          <div className="mb-8 flex items-baseline justify-between">
            <span className="font-serif text-xl uppercase">Tổng thanh toán</span>
            <span className="font-serif text-[32px] tracking-tight">{formattedTotalDue}</span>
          </div>
          {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
          <button
            onClick={onProceedToCheckout}
            disabled={!canSubmit}
            className="mb-3 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition duration-500 hover:bg-[#99854e] hover:tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Đang xử lý...' : `Thanh toán (${selectedCount})`}
          </button>
          <button
            onClick={() => onNavigate?.('chat')}
            className="w-full border border-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
          >
            Chatbot tư vấn
          </button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-[#999999]">
            Bằng việc nhấn thanh toán, bạn đồng ý với{' '}
            <a className="underline hover:text-black" href="#">
              điều khoản thuê
            </a>{' '}
            và{' '}
            <a className="underline hover:text-black" href="#">
              điều khoản dịch vụ
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
