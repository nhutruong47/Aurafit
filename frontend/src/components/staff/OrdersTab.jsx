import React from 'react';
import { formatDate, formatCurrency, StatusBadge } from './StaffDashboardUtils';

export default function OrdersTab({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  setCurrentPage,
  currentPage,
  isLoading,
  loadOrders,
  paginatedOrders,
  totalPages,
  openOrder,
  setIsModalOpen
}) {
  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap flex-1 items-center gap-4">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ chuẩn bị (Pending)</option>
            <option value="CONFIRMED">Chờ bàn giao (Confirmed)</option>
            <option value="SHIPPING">Đang giao hàng (Shipping)</option>
            <option value="RENTED">Đang thuê (Rented)</option>
            <option value="RETURNING">Đang hoàn trả (Returning)</option>
            <option value="COMPLETED">Hoàn thành (Completed)</option>
            <option value="CANCELLED">Đã hủy (Cancelled)</option>
          </select>
          <select
            value={sortOption}
            onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
            className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="PRICE_DESC">Tổng tiền cao nhất</option>
            <option value="PRICE_ASC">Tổng tiền thấp nhất</option>
          </select>
        </div>
        <button
          onClick={() => loadOrders()}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm border whitespace-nowrap ${isLoading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Tải lại
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg bg-white shadow flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày thuê</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày trả</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Loại đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tiền cọc</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      RO-{String(order.id).padStart(4, '0')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs">{order.customerPhone}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.rentalStartDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.rentalEndDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {order.deliveryMethod === 'STORE_PICKUP' ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Tại cửa hàng</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">GHN</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(order.totalDeposit)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => { openOrder(order.id); setIsModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                         Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6 shrink-0">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">Trước</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">Tiếp</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                    <span className="sr-only">Previous</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                    <span className="sr-only">Next</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
