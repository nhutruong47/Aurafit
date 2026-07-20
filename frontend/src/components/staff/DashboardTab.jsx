import { formatDate, StatusBadge } from './StaffDashboardUtils';

export default function DashboardTab({ 
  activeTotals, 
  priorityOrders, 
  openOrder, 
  setIsModalOpen, 
  navigate 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng đơn', value: activeTotals.totalOrders, icon: 'inventory_2' },
          { label: 'Chờ chuẩn bị', value: activeTotals.pending, icon: 'hourglass_empty' },
          { label: 'Chờ bàn giao', value: activeTotals.confirmed, icon: 'inventory' },
          { label: 'Đang thuê', value: activeTotals.renting, icon: 'local_shipping' },
          { label: 'Chờ trả', value: activeTotals.overdue, icon: 'warning', color: 'text-red-600' },
          { label: 'Đã hoàn thành', value: activeTotals.returned, icon: 'check_circle', color: 'text-green-600' },
        ].map((metric, idx) => (
          <div key={idx} className="overflow-hidden border border-[#d7d2c8] bg-white rounded-none md:rounded-sm shadow-sm">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className={`material-symbols-outlined text-3xl ${metric.color || 'text-[#7f7041]'}`}>
                    {metric.icon}
                  </span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{metric.label}</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{metric.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-[#d7d2c8] bg-white rounded-none md:rounded-sm shadow-sm p-6">
        <h3 className="font-serif italic text-2xl font-normal text-[#171717] mb-4">Công việc cần xử lý</h3>
        {priorityOrders?.length === 0 ? (
          <p className="text-sm text-gray-500">Tuyệt vời! Không có công việc nào cần xử lý khẩn cấp.</p>
        ) : (
          <div className="space-y-4">
            {priorityOrders?.map(order => (
               <div key={order.id} className="flex flex-wrap items-center justify-between py-3 border-b last:border-0 text-sm gap-4">
                  <div>
                    <span className="font-medium text-gray-900 block mb-1">RO-{String(order.id).padStart(4, '0')} - {order.customerName}</span>
                    <span className="text-xs text-gray-500 block">Ngày giao: {formatDate(order.rentalStartDate)} | Ngày trả: {formatDate(order.rentalEndDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <button onClick={() => { openOrder(order.id); setIsModalOpen(true); }} className="text-[#7f7041] hover:text-[#5c502b] font-medium text-xs underline underline-offset-2">Xem chi tiết</button>
                    {order.deliveryMethod === 'STORE_PICKUP' ? (
                      <>
                        {order.status === 'CONFIRMED' && (
                          <button onClick={() => { navigate('/staff?tab=pickup'); setTimeout(() => openOrder(order.id), 100); }} className="px-4 py-2 border border-[#7f7041] text-[#7f7041] rounded-sm text-xs hover:bg-[#7f7041] hover:text-white transition-colors">Đi tới Pickup</button>
                        )}
                        {(order.status === 'RENTED' || order.status === 'PICKED_UP' || order.status === 'RETURNING') && (
                          <button onClick={() => { navigate('/staff?tab=return'); setTimeout(() => openOrder(order.id), 100); }} className="px-4 py-2 bg-[#111111] text-white rounded-sm text-xs hover:bg-[#7f7041] transition-colors">Đi tới Return</button>
                        )}
                      </>
                    ) : (
                      <button onClick={() => { openOrder(order.id); setIsModalOpen(true); }} className="px-4 py-2 border border-[#7f7041] text-[#7f7041] rounded-sm text-xs hover:bg-[#7f7041] hover:text-white transition-colors">Xử lý ngay</button>
                    )}
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
