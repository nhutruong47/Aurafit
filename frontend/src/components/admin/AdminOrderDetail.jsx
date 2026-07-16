import { useEffect, useState } from 'react';
import { adminOrderService } from '../../services/adminOrderService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminOrderDetail({ isOpen, onClose, order, onRefresh }) {
  const [isLoading, setIsLoading] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !order) return null;

  const handleAction = async (actionFn, successMsg) => {
    try {
      setIsLoading(true);
      await actionFn(order.id);
      window.alert(successMsg);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    window.alert(`Đã copy mã vận đơn ${type}`);
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'CONFIRMED':
        return (
          <button
            onClick={() => handleAction(adminOrderService.shipOrder, 'Đã giao hàng cho GHN')}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#99854e] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#857241] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Giao hàng cho GHN'}
          </button>
        );
      case 'SHIPPING':
        return (
          <button
            onClick={() => handleAction(adminOrderService.markOrderRented, 'Khách đã nhận đồ thành công')}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#2e7d32] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#1b5e20] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận Khách Đã Nhận'}
          </button>
        );
      case 'RENTED':
        return (
          <button
            onClick={() => handleAction(adminOrderService.returnOrder, 'Đã tạo vận đơn thu hồi GHN')}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#d32f2f] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#b71c1c] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Tạo Vận Đơn Thu Hồi'}
          </button>
        );
      case 'RETURNING':
        return (
          <button
            onClick={() => handleAction(adminOrderService.completeOrder, 'Nghiệm thu đồ và hoàn tất đơn hàng')}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#1976d2] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#115293] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Nghiệm Thu & Hoàn Tất'}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px] p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e1dddc] bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-gray-800">
              Đơn Hàng RO-{String(order.id).padStart(4, '0')}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-[#5f5e5e]">Trạng thái:</span>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-gray-200 text-gray-800">
                {order.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Financial & Items */}
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider border-b border-[#e1dddc] pb-2">
                  Tài Chính
                </h3>
                <div className="space-y-2 text-sm bg-gray-50 p-4 border border-[#e1dddc]">
                  <div className="flex justify-between">
                    <span className="text-[#5f5e5e]">Phí thuê:</span>
                    <span className="font-semibold">{formatCurrency(order.totalRentalFee || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f5e5e]">Tiền cọc:</span>
                    <span className="font-semibold">{formatCurrency(order.totalDeposit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f5e5e]">Phí vận chuyển:</span>
                    <span className="font-semibold">
                      {order.shippingFee ? formatCurrency(order.shippingFee) : '0 đ'}
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#e1dddc] flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-gray-800">Tổng thanh toán:</span>
                    <span className="text-lg font-bold text-[#ba1a1a]">{formatCurrency(order.finalAmount || 0)}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider border-b border-[#e1dddc] pb-2">
                  Sản Phẩm Đã Thuê ({order.details?.length || 0})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {order.details?.map(detail => (
                    <div key={detail.id} className="flex items-center gap-4 border border-[#e1dddc] p-2 bg-white">
                      <img 
                        src={detail.costumeImageUrl || detail.imageUrls?.[0] || 'https://placehold.co/100x120?text=No+Image'} 
                        alt={detail.costumeName} 
                        className="w-16 h-20 object-cover bg-gray-100" 
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-2">{detail.costumeName}</p>
                        <p className="text-xs text-[#5f5e5e] uppercase tracking-wider mt-1">
                          {detail.skuCode} | Size: {detail.size}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: Customer & Tracking */}
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider border-b border-[#e1dddc] pb-2">
                  Thông Tin Khách Hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-[#5f5e5e] w-24 inline-block">Họ tên:</span> <span className="font-semibold">{order.customerName}</span></p>
                  <p><span className="text-[#5f5e5e] w-24 inline-block">SĐT:</span> <span className="font-semibold">{order.customerPhone}</span></p>
                  <p><span className="text-[#5f5e5e] w-24 inline-block">Email:</span> <span className="font-semibold">{order.customerEmail}</span></p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider border-b border-[#e1dddc] pb-2">
                  Thời Gian Thuê
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 border border-[#e1dddc]">
                  <div>
                    <p className="text-xs text-[#5f5e5e] uppercase tracking-wider mb-1">Ngày nhận</p>
                    <p className="font-semibold">
                      {order.rentalStartDate ? new Date(order.rentalStartDate).toLocaleDateString('vi-VN') : '---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5f5e5e] uppercase tracking-wider mb-1">Ngày trả</p>
                    <p className="font-semibold">
                      {order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString('vi-VN') : '---'}
                    </p>
                  </div>
                </div>
              </section>

              {/* GHN Tracking */}
              {(order.ghnOrderCode || order.ghnReturnOrderCode) && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider border-b border-[#e1dddc] pb-2">
                    Vận Đơn GHN
                  </h3>
                  <div className="space-y-3">
                    {order.ghnOrderCode && (
                      <div className="bg-[#f8f4e8] p-3 border border-[#99854e] flex justify-between items-center">
                        <div>
                          <p className="text-xs text-[#5f5e5e] uppercase tracking-wider">Mã giao hàng</p>
                          <p className="font-semibold text-gray-800">{order.ghnOrderCode}</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(order.ghnOrderCode, 'giao')}
                          className="text-[#99854e] hover:text-[#857241] p-2"
                          title="Copy mã giao hàng"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {order.ghnReturnOrderCode && (
                      <div className="bg-[#fdf3f3] p-3 border border-[#d32f2f] flex justify-between items-center">
                        <div>
                          <p className="text-xs text-[#5f5e5e] uppercase tracking-wider">Mã thu hồi</p>
                          <p className="font-semibold text-gray-800">{order.ghnReturnOrderCode}</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(order.ghnReturnOrderCode, 'thu hồi')}
                          className="text-[#d32f2f] hover:text-[#b71c1c] p-2"
                          title="Copy mã thu hồi"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#e1dddc] bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
          {renderActionButtons()}
        </div>

      </div>
    </div>
  );
}
