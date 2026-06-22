// Sidebar tom tat giao hang va thanh toan cua trang order success.
import { formatCurrency } from '../../utils/formatCurrency';

function InfoRow({ icon, title, value, muted = false }) {
  return (
    <div className="flex gap-4">
      <span className="material-symbols-outlined text-[#99854e]">{icon}</span>
      <div>
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.15em]">{title}</p>
        <p className={muted ? 'leading-6 text-[#5f5e5e]' : 'leading-6'}>{value}</p>
      </div>
    </div>
  );
}

function SmallSummary({ label, value }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function OrderSuccessSidebar({ order }) {
  const subtotal = order?.totalRentalPrice;
  const deposit = order?.totalDeposit;
  const discount = order?.discountAmount;
  const total = order?.finalAmount;

  return (
    <aside className="md:col-span-5">
      <div className="sticky top-32 space-y-12">
        <div className="border border-[#cfc4c5] bg-white p-10">
          <h2 className="mb-8 border-b border-[#cfc4c5] pb-4 text-[12px] font-semibold uppercase tracking-[0.2em]">
            Thông tin giao hàng
          </h2>
          <div className="space-y-8">
            <InfoRow icon="person" title="Người nhận" value={order?.receiverName || 'Đang cập nhật'} />
            <InfoRow icon="call" title="Số điện thoại" value={order?.receiverPhone || 'Đang cập nhật'} />
            <InfoRow
              icon="location_on"
              title="Địa chỉ giao hàng"
              value={order?.deliveryAddress || 'Đang cập nhật'}
            />
            <InfoRow
              icon="calendar_today"
              title="Thời gian thuê"
              value={
                order?.rentalStartDate && order?.rentalEndDate
                  ? `${new Date(order.rentalStartDate).toLocaleDateString('vi-VN')} → ${new Date(order.rentalEndDate).toLocaleDateString('vi-VN')}`
                  : 'Đang cập nhật'
              }
            />
          </div>
        </div>

        <div className="px-10">
          {subtotal && <SmallSummary label="Tổng tiền thuê" value={formatCurrency(subtotal)} />}
          {deposit && <SmallSummary label="Tiền cọc (hoàn trả)" value={formatCurrency(deposit)} />}
          {discount && Number(discount) > 0 && <SmallSummary label="Giảm giá" value={`-${formatCurrency(discount)}`} />}
          <div className="mt-4 flex items-center justify-between border-t border-[#cfc4c5] pt-4">
            <span className="text-[12px] font-bold uppercase tracking-[0.15em]">Tổng thanh toán</span>
            <span className="font-serif text-3xl">{formatCurrency(total || subtotal || 0)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
