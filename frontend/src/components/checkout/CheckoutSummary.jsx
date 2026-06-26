// Tong ket gia tri don thue, phi coc va hanh dong checkout.
export default function CheckoutSummary({
  hasCartItems,
  summaryRows,
  formattedTotalDue,
  voucherCode,
  voucherApplied,
  onVoucherCodeChange,
  onApplyVoucher,
  onNavigate,
  onProceedToCheckout,
  isSubmitting,
  checkoutError,
}) {
  return (
    <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8 shadow-sm">
      <h2 className="mb-8 font-serif text-[28px] font-normal uppercase tracking-tight">Tóm tắt đơn thuê</h2>
      {hasCartItems ? (
        <>
          <div className="space-y-6">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-6 ${row.accent ? 'text-[#99854e]' : ''}`}
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-current opacity-80">
                  {row.label}
                  {row.accent && (
                    <span
                      className="material-symbols-outlined ml-1 cursor-help align-middle text-[14px]"
                      title="Áp dụng giảm giá khi thuê từ 2 sản phẩm trở lên cùng lúc."
                    >
                      help
                    </span>
                  )}
                </span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}

            <div className="border-t border-black pt-8">
              <div className="mb-8 flex items-baseline justify-between">
                <span className="font-serif text-xl uppercase">Tổng thanh toán</span>
                <span className="font-serif text-[32px] tracking-tight">{formattedTotalDue}</span>
              </div>
              {checkoutError && <p className="mb-3 text-sm text-red-600">{checkoutError}</p>}
              <button
                onClick={onProceedToCheckout}
                disabled={isSubmitting}
                className="mb-2 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition duration-500 hover:bg-[#99854e] hover:tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
              </button>
              <button
                onClick={() => onNavigate?.('chat')}
                className="mb-4 w-full border border-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
              >
                Liên hệ Admin để tư vấn giỏ hàng
              </button>
              <p className="text-center text-[11px] leading-relaxed text-[#999999]">
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

          <div className="mt-12 border-t border-[#cfc4c5] pt-8">
            <label className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em]">
              Nhập mã giảm giá / Voucher
            </label>
            <div className="flex">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => onVoucherCodeChange(e.target.value)}
                placeholder="Mã Voucher..."
                className="w-full border border-r-0 border-[#cfc4c5] bg-transparent px-4 py-3 text-sm focus:border-black focus:outline-none"
              />
              <button
                onClick={onApplyVoucher}
                className="bg-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
              >
                Áp dụng
              </button>
            </div>
            {voucherApplied && <p className="mt-2 text-xs italic text-[#99854e]">Voucher giảm 20% đã được áp dụng!</p>}
          </div>
        </>
      ) : (
        <p className="text-sm leading-6 text-[#5f5e5e]">
          Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm thuê để xem tiền cọc, bảo hiểm và lựa chọn giao hàng.
        </p>
      )}
    </div>
  );
}
