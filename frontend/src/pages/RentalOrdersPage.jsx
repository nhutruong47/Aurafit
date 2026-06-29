import OrderDetailsPanel from '../components/orders/OrderDetailsPanel';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersList from '../components/orders/OrdersList';
import OrdersLoadingState from '../components/orders/OrdersLoadingState';
import AlertMessage from '../components/ui/AlertMessage';
import EmptyState from '../components/ui/EmptyState';
import { useRentalOrders } from '../hooks/useRentalOrders';

import { cancelOrder } from '../services/rentalOrderService';
import { useToastStore } from '../store/useToastStore';

export default function RentalOrdersPage({ currentUser, onNavigate }) {
  const { orders, selectedOrder, isLoading, error, loadOrders, selectOrder } = useRentalOrders(currentUser);
  const addToast = useToastStore((s) => s.addToast);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      await cancelOrder(orderId);
      addToast('Đã hủy đơn hàng thành công.');
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <main className="mx-auto max-w-[1440px] px-5 py-16 md:px-20 lg:py-24">
        <OrdersHeader onRefresh={loadOrders} onContinueShopping={() => onNavigate?.('home')} />

        {error && <AlertMessage text={error} className="mb-8" />}

        {isLoading ? (
          <OrdersLoadingState />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Chưa có đơn hàng"
            message="Bạn chưa có đơn đặt hàng nào trong lịch sử."
            icon="package_2"
            actionLabel="Tiếp tục mua sắm"
            onAction={() => onNavigate?.('home')}
            className="p-12"
          />
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
            <OrdersList orders={orders} selectedOrderId={selectedOrder?.id} onSelectOrder={selectOrder} />
            <div className="lg:col-span-7">{selectedOrder && <OrderDetailsPanel order={selectedOrder} onCancel={handleCancelOrder} />}</div>
          </div>
        )}
      </main>
    </div>
  );
}
