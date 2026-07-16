import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { adminOrderService } from '../../services/adminOrderService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminOrderDetail({ order, onRefresh }) {
  const [isLoading, setIsLoading] = useState(false);

  if (!order) {
    return <div className="p-5 text-center text-[#5f5e5e]">Chưa chọn đơn hàng.</div>;
  }

  const handleAction = async (actionFn, successMsg) => {
    try {
      setIsLoading(true);
      await actionFn(order.id);
      toast.success(successMsg);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'CONFIRMED':
        return (
          <button
            onClick={() => handleAction(adminOrderService.shipOrder, 'Đã giao hàng cho GHN')}
            disabled={isLoading}
            className="bg-[#99854e] px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#857241] disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Giao hàng cho GHN'}
          </button>
        );
      case 'SHIPPING':
        return (
          <button
            onClick={() => handleAction(adminOrderService.markOrderRented, 'Khách đã nhận đồ thành công')}
            disabled={isLoading}
            className="bg-[#2e7d32] px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#1b5e20] disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận Khách Đã Nhận'}
          </button>
        );
      case 'RENTED':
        return (
          <button
            onClick={() => handleAction(adminOrderService.returnOrder, 'Đã tạo vận đơn thu hồi GHN')}
            disabled={isLoading}
            className="bg-[#d32f2f] px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#b71c1c] disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Tạo Vận Đơn Thu Hồi'}
          </button>
        );
      case 'RETURNING':
        return (
          <button
            onClick={() => handleAction(adminOrderService.completeOrder, 'Nghiệm thu đồ và hoàn tất đơn hàng')}
            disabled={isLoading}
            className="bg-[#1976d2] px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#115293] disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Nghiệm Thu & Hoàn Tất'}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border border-[#e1dddc] bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between border-b border-[#e1dddc] pb-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider">Đơn Hàng RO-{String(order.id).padStart(4, '0')}</h2>
          <p className="text-sm text-[#5f5e5e] mt-1">Trạng thái: <span className="font-semibold">{order.status}</span></p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          {renderActionButtons()}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-2">
          <p><span className="font-semibold">Khách hàng:</span> {order.customerName}</p>
          <p><span className="font-semibold">Email:</span> {order.customerEmail}</p>
          <p><span className="font-semibold">SĐT:</span> {order.customerPhone}</p>
        </div>
        <div className="space-y-2">
          <p><span className="font-semibold">Phí thuê:</span> {formatCurrency(order.totalRentalFee || 0)}</p>
          <p><span className="font-semibold">Tiền cọc:</span> {formatCurrency(order.totalDeposit || 0)}</p>
          {order.shippingFee !== undefined && (
            <p><span className="font-semibold">Phí vận chuyển:</span> {formatCurrency(order.shippingFee)}</p>
          )}
          <p className="text-base font-bold text-[#ba1a1a]">
            Tổng thanh toán: {formatCurrency(order.finalAmount || 0)}
          </p>
        </div>
      </div>

      {(order.ghnOrderCode || order.ghnReturnOrderCode) && (
        <div className="mb-6 bg-[#f8f4e8] p-4 border border-[#99854e]">
          <h3 className="font-semibold uppercase tracking-wider mb-2 text-sm">Thông Tin Vận Đơn GHN</h3>
          {order.ghnOrderCode && (
            <p className="text-sm"><span className="font-semibold">Mã vận đơn giao:</span> {order.ghnOrderCode}</p>
          )}
          {order.ghnReturnOrderCode && (
            <p className="text-sm mt-1"><span className="font-semibold">Mã vận đơn thu hồi:</span> {order.ghnReturnOrderCode}</p>
          )}
        </div>
      )}

      <div>
        <h3 className="font-semibold uppercase tracking-wider mb-4 border-b border-[#e1dddc] pb-2 text-sm">Sản Phẩm Đã Thuê</h3>
        <div className="space-y-3">
          {order.details?.map(detail => (
            <div key={detail.id} className="flex items-center gap-4 border p-3">
              <img src={detail.costumeImageUrl || detail.imageUrls?.[0]} alt={detail.costumeName} className="w-16 h-20 object-cover bg-gray-100" />
              <div>
                <p className="font-semibold">{detail.costumeName}</p>
                <p className="text-xs text-[#5f5e5e] uppercase tracking-wider mt-1">{detail.skuCode} | Size: {detail.size}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
