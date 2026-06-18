// Danh sach don hang ben trai trong staff dashboard.
import { StatusBadge } from './StaffDashboardShared';

export default function StaffOrderList({ orders, activeOrderId, onOpenOrder }) {
  return (
    <aside className="border border-[#cfc4c5] bg-white lg:col-span-3">
      <div className="border-b border-[#cfc4c5] px-5 py-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Danh sách đơn thuê</h2>
      </div>
      <div className="max-h-[680px] divide-y divide-[#e1dddc] overflow-auto">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onOpenOrder(order.id)}
            className={`w-full px-5 py-5 text-left transition hover:bg-[#f8f4e8] ${
              order.id === activeOrderId ? 'bg-[#f8f4e8]' : 'bg-white'
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">RO-{String(order.id).padStart(4, '0')}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="font-medium">{order.customerName}</p>
            <p className="mt-1 truncate text-sm text-[#5f5e5e]">{order.details?.[0]?.costumeName || 'Chưa có trang phục'}</p>
          </button>
        ))}
      </div>
    </aside>
  );
}
