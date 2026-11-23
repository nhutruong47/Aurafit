import { useEffect, useRef, useState } from 'react';
import { adminOrderService } from '../../services/adminOrderService';

// Localized statuses based on the existing mappings
const ORDER_STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  SHIPPING: { label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800' },
  RENTED: { label: 'Đang thuê', color: 'bg-purple-100 text-purple-800' },
  RETURNING: { label: 'Đang hoàn trả', color: 'bg-orange-100 text-orange-800' },
  RETURNED: { label: 'Đã trả đồ', color: 'bg-teal-100 text-teal-800' },
  PENDING_REFUND: { label: 'Chờ giải ngân', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800' },
  PICKED_UP: { label: 'Khách đã lấy hàng', color: 'bg-cyan-100 text-cyan-800' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

export default function CustomerDetailModal({ customer, onClose }) {
  const modalRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Click outside to close
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Fetch orders by user email (using keyword search of admin API)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?.email) return;
      try {
        setIsLoadingOrders(true);
        const data = await adminOrderService.getAllOrders(0, 50, '', customer.email);
        // Ensure we only match orders that belong to this specific user
        const exactUserOrders = (data.content || []).filter(
          (o) => o.customerEmail === customer.email
        );
        setOrders(exactUserOrders);
      } catch (error) {
        console.error('Failed to fetch user orders', error);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300">
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-[#FAF5ED] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DED2C2] bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-serif italic text-black">
              {customer.fullName || 'Khách hàng'}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                customer.status === 'ACTIVE'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {customer.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6259] transition hover:text-black"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Left Column: Profile Info */}
          <div className="w-full md:w-1/3 border-r border-[#E8DDCE] p-6 space-y-6 bg-white">
            <div>
              <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#756536]">
                Thông tin cá nhân
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6259]">Email</p>
                  <p className="font-medium text-black">{customer.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6259]">Số điện thoại</p>
                  <p className="font-medium text-black">{customer.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6259]">Địa chỉ</p>
                  <p className="font-medium text-black leading-relaxed">{customer.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E8DDCE]">
              <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#756536]">
                Tài khoản ngân hàng
              </h3>
              {customer.bankName ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6259]">Ngân hàng</p>
                    <p className="font-medium text-black">{customer.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6259]">Số tài khoản</p>
                    <p className="font-medium text-black">{customer.bankAccountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6259]">Tên chủ tài khoản</p>
                    <p className="font-medium text-black">{customer.bankAccountName}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#6B6259] italic">Chưa cập nhật thông tin hoàn tiền.</p>
              )}
            </div>
          </div>

          {/* Right Column: Order History */}
          <div className="w-full md:w-2/3 p-6 bg-[#FAF5ED]">
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#756536]">
              Lịch sử đơn hàng
            </h3>
            
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#756536]">
                  autorenew
                </span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#DED2C2] bg-white">
                <span className="material-symbols-outlined text-[48px] text-[#E8DDCE] mb-3">
                  history
                </span>
                <p className="text-sm text-[#6B6259]">Khách hàng chưa có lịch sử thuê đồ.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E8DDCE] bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    <tr>
                      <th className="px-4 py-3">Mã ĐH</th>
                      <th className="px-4 py-3">Ngày tạo</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Tổng cộng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDCE]">
                    {orders.map((order) => {
                      const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                      return (
                        <tr key={order.id} className="transition hover:bg-[#f5f2eb]">
                          <td className="px-4 py-3 font-medium text-black">#{order.id}</td>
                          <td className="px-4 py-3 text-[#6B6259]">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-black">
                            {order.finalAmount?.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
