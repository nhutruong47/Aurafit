import { useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../store/useCheckoutStore';
import { getOrderCode, getOrderTimeline, mapOrderStatus } from './orderUtils';
import OrderTimeline from './OrderTimeline';
import OrderSummaryCard from './OrderSummaryCard';
import CustomerOrderDetailSkeleton from './CustomerOrderDetailSkeleton';

export default function OrderDetailsPanel({ order, isDetailLoading, onCancel }) {
  const statusInfo = mapOrderStatus(order.status);
  const timeline = getOrderTimeline(order);
  const navigate = useNavigate();
  const setPendingOrderId = useCheckoutStore((state) => state.setPendingOrderId);

  const handlePayNow = () => {
    setPendingOrderId(order.id);
    navigate('/payment');
  };

  return (
    <div className="sticky top-28 border border-[#cfc4c5] bg-white p-8 md:p-10">
      <div className="mb-8 flex items-baseline justify-between border-b border-[#cfc4c5] pb-6">
        <h2 className="font-serif text-3xl font-normal">Chi tiết: {getOrderCode(order.id)}</h2>
        <div className="flex items-center gap-4">
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && onCancel && (
            <button onClick={() => onCancel(order.id)} className="text-[10px] font-bold uppercase tracking-wider text-red-600 transition hover:text-red-800">
              Hủy đơn
            </button>
          )}
          {order.status === 'PENDING' && (
            <button 
              onClick={handlePayNow}
              className="bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#99854e]"
            >
              Thanh toán ngay
            </button>
          )}
          <span className={`text-[12px] font-bold uppercase tracking-[0.2em] ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div
        className={`transition-opacity duration-300 ${isDetailLoading ? 'opacity-40' : 'opacity-100'}`}
      >
        {isDetailLoading && !order.details ? (
          <CustomerOrderDetailSkeleton />
        ) : (
          <>
            <div className="mb-12">
              <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                Tiến trình đơn hàng
              </h3>
              <OrderTimeline timeline={timeline} />
            </div>

            <OrderSummaryCard details={order.details} />
          </>
        )}
      </div>
    </div>
  );
}
