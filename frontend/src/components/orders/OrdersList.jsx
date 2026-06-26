import { formatCurrency } from '../../utils/formatCurrency';
import { getOrderCode, mapOrderStatus } from './orderUtils';

const fallbackImage =
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80';

export default function OrdersList({ orders, selectedOrderId, onSelectOrder }) {
  return (
    <div className="lg:col-span-5">
      <h2 className="mb-6 text-[12px] font-semibold uppercase tracking-[0.2em]">Tất cả đơn hàng</h2>
      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = mapOrderStatus(order.status);

          return (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className={`flex cursor-pointer items-center justify-between border bg-white p-5 transition duration-300 hover:border-[#99854e] hover:shadow-md ${
                selectedOrderId === order.id ? 'border-[#99854e] shadow-md' : 'border-[#cfc4c5]'
              }`}
            >
              <div className="flex gap-4">
                <div className="h-16 w-12 shrink-0 overflow-hidden bg-[#eeeeee]">
                  <img src={fallbackImage} alt="Đơn hàng" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest">{getOrderCode(order.id)}</p>
                  <p className="mt-1 text-xs text-[#5f5e5e]">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#999999]">
                    {order.itemCount || 0} món
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[11px] font-bold uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.text}</p>
                <p className="mt-1 font-serif text-lg">
                  {formatCurrency(order.totalRentalPrice || order.totalRentalFee || 0)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
