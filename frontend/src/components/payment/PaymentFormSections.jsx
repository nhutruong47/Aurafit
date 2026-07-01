import { formatCurrency } from '../../utils/formatCurrency';

function CheckoutSection({ number, title, meta, icon, children }) {
  return (
    <section>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-normal italic">
          {number}. {title}
        </h2>
        {icon ? (
          <span className="material-symbols-outlined text-[#999999]">{icon}</span>
        ) : (
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-[#e8e2e3] pb-4">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
        {label}
      </p>
      <p className="text-sm leading-6 text-[#1a1c1c]">{value || 'Đang cập nhật'}</p>
    </div>
  );
}

function GoldDivider() {
  return <hr className="h-px border-none bg-gradient-to-r from-transparent via-[#99854e] to-transparent" />;
}

function formatDateRange(start, end) {
  if (!start || !end) return 'Đang cập nhật';

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}

const statusStyles = {
  PENDING: { badge: 'bg-[#fff8e1] text-[#f57f17] border-[#f57f17]', label: 'Chờ thanh toán' },
  PAID: { badge: 'bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]', label: 'Đã thanh toán' },
  CONFIRMED: { badge: 'bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]', label: 'Đã xác nhận' },
  FAILED: { badge: 'bg-[#ffebee] text-[#c62828] border-[#c62828]', label: 'Thanh toán thất bại' },
  REFUNDED: { badge: 'bg-[#fce4ec] text-[#880e4f] border-[#880e4f]', label: 'Đã hoàn tiền' },
};

export default function PaymentFormSections({ order, paymentInit, isPaid, paymentStatus, statusLabel, isCheckingStatus, countdown }) {
  const displayOrderId = order?.id || '----';
  const style = statusStyles[paymentStatus] || statusStyles.PENDING;

  return (
    <div className="space-y-16 lg:max-w-3xl">
      <CheckoutSection number="01" title="Thông tin giao hàng" meta="">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DetailRow label="Người nhận" value={order?.receiverName} />
          <DetailRow label="Số điện thoại" value={order?.receiverPhone} />
          <div className="md:col-span-2">
            <DetailRow label="Địa chỉ giao hàng" value={order?.deliveryAddress} />
          </div>
        </div>
      </CheckoutSection>

      <GoldDivider />

      <CheckoutSection number="02" title="Thông tin đơn thuê" meta="">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DetailRow label="Mã đơn" value={`ARF${String(displayOrderId).padStart(4, '0')}`} />
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
              Trạng thái hiện tại
            </p>
            <span className={`inline-block border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${style.badge}`}>
              {isCheckingStatus && !paymentStatus ? 'Đang kiểm tra...' : (statusLabel || style.label)}
            </span>
          </div>
          <DetailRow label="Thời gian thuê" value={formatDateRange(order?.rentalStartDate, order?.rentalEndDate)} />
          <DetailRow
            label="Số sản phẩm"
            value={order?.details?.length ? `${order.details.length} sản phẩm` : 'Đang cập nhật'}
          />
        </div>
      </CheckoutSection>

      <GoldDivider />

      <CheckoutSection number="03" title="Thanh toán VietQR" icon="qr_code_2">
        {isPaid ? (
          <div className="flex flex-col items-center gap-6 rounded-lg border border-[#2e7d32] bg-[#f1f8e9] p-10 text-center">
            <span className="material-symbols-outlined text-6xl text-[#2e7d32]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <div>
              <h3 className="mb-2 font-serif text-3xl italic text-[#2e7d32]">Thanh toán thành công!</h3>
              <p className="text-sm text-[#5f5e5e]">
                Đơn hàng <strong>ARF{String(displayOrderId).padStart(4, '0')}</strong> đã được thanh toán.
                AuraFit sẽ liên hệ xác nhận trong thời gian sớm nhất.
              </p>
            </div>
            {paymentInit && (
              <div className="w-full rounded border border-[#c8e6c9] bg-white p-4 text-left">
                <p className="text-sm">
                  <strong>Số tiền đã nhận:</strong> {formatCurrency(paymentInit.amount || 0)}
                </p>
                {paymentInit.paymentContent && (
                  <p className="mt-1 text-sm">
                    <strong>Nội dung:</strong> {paymentInit.paymentContent}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : paymentInit ? (
          <div className="space-y-6">
            {/* QR Code + transfer info */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* QR Image */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {paymentInit.qrImageUrl ? (
                    <img
                      src={paymentInit.qrImageUrl}
                      alt="Mã VietQR thanh toán"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#f5f5f5"/><text x="128" y="128" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="#999">QR đang tải...</text></svg>');
                      }}
                      className="h-64 w-64 rounded-lg border border-[#cfc4c5] bg-white object-contain p-2 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-[#cfc4c5] bg-[#f5f5f5]">
                      <span className="material-symbols-outlined text-6xl text-[#999]">qr_code</span>
                    </div>
                  )}
                  {/* Countdown indicator */}
                  {!isPaid && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1">
                      <span className="text-xs font-mono text-white">
                        Kiểm tra sau {countdown}s
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-[#999999]">
                  Quét mã QR bằng ứng dụng ngân hàng
                </p>
              </div>

              {/* Transfer details */}
              <div className="flex flex-col justify-center gap-4">
                <div className="rounded-lg border border-[#99854e]/30 bg-[#f8f4e8] p-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#725f2f]">
                    Thông tin chuyển khoản
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-[#5f5e5e]">Số tiền</span>
                      <span className="font-semibold text-[#99854e]">
                        {formatCurrency(paymentInit.amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#5f5e5e]">Nội dung CK</span>
                      <span className="font-mono font-semibold">{paymentInit.paymentContent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#5f5e5e]">Mã đơn</span>
                      <span className="font-semibold">ARF{String(displayOrderId).padStart(4, '0')}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[#5f5e5e]">
                  Sau khi chuyển khoản thành công, hệ thống sẽ tự động kiểm tra và cập nhật trạng thái đơn hàng trong{' '}
                  <strong>10 giây</strong>. Vui lòng không đóng trình duyệt.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border border-[#cfc4c5] bg-white p-5">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                Quy trình thanh toán
              </p>
              <p className="font-serif text-3xl italic">ARF{String(displayOrderId).padStart(4, '0')}</p>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                Nhấn <strong>"Tạo mã QR thanh toán"</strong> bên phải để nhận mã VietQR thanh toán.
                Hệ thống sẽ tự động kiểm tra giao dịch và cập nhật trạng thái đơn hàng khi bạn hoàn tất thanh toán.
              </p>
            </div>
            <div className="rounded-lg border border-[#e8e2e3] bg-[#fafafa] p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#999999]">
                Các bước thực hiện
              </p>
              <ol className="space-y-3 text-sm text-[#5f5e5e]">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#99854e] text-xs font-bold text-white">1</span>
                  Nhấn <strong>"Tạo mã QR thanh toán"</strong> bên phải màn hình
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#99854e] text-xs font-bold text-white">2</span>
                  Mở ứng dụng ngân hàng trên điện thoại
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#99854e] text-xs font-bold text-white">3</span>
                  Quét mã QR hoặc nhập nội dung chuyển khoản
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#99854e] text-xs font-bold text-white">4</span>
                  Xác nhận thanh toán — hệ thống tự động cập nhật trạng thái
                </li>
              </ol>
            </div>
          </div>
        )}
      </CheckoutSection>
    </div>
  );
}
