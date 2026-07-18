import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { formatCurrency } from '../../utils/formatCurrency';
import AlertMessage from '../ui/AlertMessage';
import EmptyState from '../ui/EmptyState';
import AdminOrderDetail from './AdminOrderDetail';
import Pagination from './Pagination';

const ORDER_STATUSES = [
  ['', 'Tất cả trạng thái'],
  ['PENDING', 'Chờ thanh toán'],
  ['CONFIRMED', 'Đã xác nhận'],
  ['PICKED_UP', 'Đã bàn giao'],
  ['SHIPPING', 'Đang giao'],
  ['RENTED', 'Đang thuê'],
  ['RETURNING', 'Đang hoàn trả'],
  ['RETURNED', 'Đã trả'],
  ['COMPLETED', 'Hoàn thành'],
  ['CANCELLED', 'Đã hủy'],
];

const STATUS_LABELS = Object.fromEntries(ORDER_STATUSES.filter(([status]) => status));
const STATUS_STYLES = {
  PENDING: 'border-amber-300 bg-amber-50 text-amber-800',
  CONFIRMED: 'border-blue-300 bg-blue-50 text-blue-800',
  PICKED_UP: 'border-sky-300 bg-sky-50 text-sky-800',
  SHIPPING: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  RENTED: 'border-violet-300 bg-violet-50 text-violet-800',
  RETURNING: 'border-orange-300 bg-orange-50 text-orange-800',
  RETURNED: 'border-cyan-300 bg-cyan-50 text-cyan-800',
  COMPLETED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  CANCELLED: 'border-red-300 bg-red-50 text-red-800',
};

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

export default function AdminOrdersSection() {
  const {
    orders,
    page,
    status,
    keyword,
    totalPages,
    totalElements,
    selectedOrder,
    isLoading,
    isLoadingDetail,
    error,
    setPage,
    changeStatus,
    changeKeyword,
    setSelectedOrder,
    loadOrders,
    openOrder,
  } = useAdminOrders();
  const [openingOrderId, setOpeningOrderId] = useState(null);

  const handleOpenOrder = async (orderId) => {
    setOpeningOrderId(orderId);
    await openOrder(orderId);
    setOpeningOrderId(null);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 border border-[#d7d2c8] bg-[#fdfdfb] p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f7041]">Vận hành</p>
          <h2 className="mt-2 font-serif text-4xl italic">Chi tiết đơn hàng</h2>
          <p className="mt-2 text-sm text-[#5f5e5e]">Theo dõi toàn bộ đơn thuê và mở thông tin chi tiết từng đơn.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_210px_auto]">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Tìm kiếm</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#777777]">search</span>
              <input
                type="search"
                value={keyword}
                onChange={(event) => changeKeyword(event.target.value)}
                placeholder="Mã đơn, tên, email, SĐT..."
                className="h-11 w-full border border-[#d7d2c8] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#7f7041] focus:ring-1 focus:ring-[#7f7041]/20"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Trạng thái</span>
            <select
              value={status}
              onChange={(event) => changeStatus(event.target.value)}
              className="h-11 min-w-52 border border-[#d7d2c8] bg-white px-3 text-sm outline-none focus:border-[#7f7041]"
            >
              {ORDER_STATUSES.map(([value, label]) => (
                <option key={value || 'all'} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            className="flex h-11 items-center justify-center gap-2 border border-[#d7d2c8] bg-white px-4 text-sm font-medium transition hover:border-[#7f7041] disabled:opacity-50 sm:self-end"
          >
            <span className={`material-symbols-outlined text-[19px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            Tải lại
          </button>
        </div>
      </div>

      {error && <AlertMessage text={error} />}

      <div className="overflow-hidden border border-[#d7d2c8] bg-[#fdfdfb]">
        <div className="flex items-center justify-between border-b border-[#d7d2c8] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Danh sách đơn</p>
          <span className="text-sm text-[#5f5e5e]">{totalElements} đơn hàng</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#5f5e5e]">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải danh sách đơn hàng...
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Chưa có đơn hàng"
            message="Không tìm thấy đơn hàng phù hợp với từ khóa hoặc trạng thái đã chọn."
            className="border-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-[#f4f4f2] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666]">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Ngày tạo</th>
                  <th className="px-5 py-3">Hình thức</th>
                  <th className="px-5 py-3">Tổng thanh toán</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe7df]">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-[#faf8f2]">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">RO-{String(order.id).padStart(4, '0')}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{order.customerName || order.receiverName || '—'}</p>
                      <p className="mt-1 text-xs text-[#777777]">{order.customerPhone || order.receiverPhone || order.customerEmail || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#5f5e5e]">{formatDateTime(order.createdAt)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#5f5e5e]">
                      {order.deliveryMethod === 'STORE_PICKUP' ? 'Nhận tại cửa hàng' : 'Giao hàng GHN'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{formatCurrency(order.finalAmount || 0)}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${STATUS_STYLES[order.status] || 'border-slate-300 bg-slate-50 text-slate-700'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenOrder(order.id)}
                        disabled={isLoadingDetail}
                        className="text-sm font-semibold text-[#7f7041] underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        {openingOrderId === order.id ? 'Đang tải...' : 'Xem chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 pb-5">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
          />
        </div>
      </div>

      <AdminOrderDetail
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onRefresh={loadOrders}
      />
    </section>
  );
}
