import OrderDetailsPanel from '../components/orders/OrderDetailsPanel';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersList from '../components/orders/OrdersList';
import OrdersLoadingState from '../components/orders/OrdersLoadingState';
import AlertMessage from '../components/ui/AlertMessage';
import EmptyState from '../components/ui/EmptyState';
import { useCustomerOrders } from '../hooks/useCustomerOrders';

import { cancelOrder } from '../services/rentalOrderService';
import { useToastStore } from '../store/useToastStore';

import { useState } from 'react';
import CancelOrderModal from '../components/orders/CancelOrderModal';

export default function RentalOrdersPage({ currentUser, onNavigate }) {
  const { orders, selectedOrder, isListLoading, isDetailLoading, error, loadOrders, selectOrder } = useCustomerOrders(currentUser);
  const addToast = useToastStore((s) => s.addToast);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelClick = (orderId) => {
    setOrderToCancel(orderId);
    setIsCancelModalOpen(true);
  };

    const handleConfirmCancel = async (reason) => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const result = await cancelOrder(orderToCancel, reason);
      const count = result?.consecutiveCancelCount || 0;
      
      if (count >= 3) {
        addToast('Tài khoản của bạn đã bị vô hiệu hóa do tỷ lệ hủy đơn bất thường. Vui lòng liên hệ bộ phận CSKH.', 'error');
      } else if (count === 2) {
        addToast('Cảnh báo: Bạn đã hủy đơn 2 lần liên tiếp. Lần tiếp theo tài khoản sẽ bị vô hiệu hóa!', 'warning');
      } else {
        addToast('Đã hủy đơn hàng thành công.');
      }
      
      loadOrders();
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <main className="mx-auto max-w-[1440px] px-5 py-16 md:px-20 lg:py-24">
        <OrdersHeader onRefresh={loadOrders} onContinueShopping={() => onNavigate?.('home')} />

        {error && <AlertMessage text={error} className="mb-8" />}

        {isListLoading ? (
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
            <div className="lg:col-span-7">
              {selectedOrder && (
                <OrderDetailsPanel 
                  order={selectedOrder} 
                  isDetailLoading={isDetailLoading} 
                  onCancel={handleCancelClick} 
                  currentUser={currentUser}
                  onReload={loadOrders}
                />
              )}
            </div>
          </div>
        )}

        <CancelOrderModal 
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setOrderToCancel(null);
          }}
          onConfirm={handleConfirmCancel}
          isSubmitting={isCancelling}
        />
      </main>
    </div>
  );
}
