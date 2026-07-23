import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOrderDetail, fetchOrders } from '../services/rentalOrderService';

export function useCustomerOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // selectedOrder holds the shallow data immediately, then gets enriched by deep data
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOrderDetail = useCallback(async (shallowOrder) => {
    if (!shallowOrder?.id) {
      setSelectedOrder(null);
      return;
    }

    // IMMEDIATELY set the shallow order data (SWR) so the UI doesn't collapse
    setSelectedOrder(shallowOrder);
    setIsDetailLoading(true);

    try {
      const detail = await fetchOrderDetail(shallowOrder.id);
      setSelectedOrder(detail || null);
    } catch (err) {
      setError(err.message || 'Hệ thống không thể truy xuất chi tiết đơn hàng.');
      setSelectedOrder(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!currentUser?.id) {
      setOrders([]);
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setIsListLoading(false);
      return;
    }

    setIsListLoading(true);
    setError('');

    try {
      const data = await fetchOrders();
      const nextOrders = Array.isArray(data) ? data : [];
      setOrders(nextOrders);

      if (selectedOrder) {
        const updatedOrder = nextOrders.find(o => o.id === selectedOrder.id);
        setSelectedOrder(updatedOrder || null);
      }

      // Determine next selected order ID
      const nextSelectedOrderId = nextOrders.some((order) => order.id === selectedOrderId)
        ? selectedOrderId
        : nextOrders[0]?.id ?? null;

      setSelectedOrderId(nextSelectedOrderId);
      
      const shallowOrder = nextOrders.find(o => o.id === nextSelectedOrderId);
      await loadOrderDetail(shallowOrder);
    } catch (err) {
      setError(err.message || 'Hệ thống không thể truy xuất danh sách lịch sử đơn hàng.');
      setOrders([]);
      setSelectedOrderId(null);
      setSelectedOrder(null);
    } finally {
      setIsListLoading(false);
    }
  }, [currentUser?.id, loadOrderDetail, selectedOrderId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const selectOrder = useCallback(
    async (shallowOrder) => {
      const nextOrderId = shallowOrder?.id ?? null;
      if (nextOrderId === selectedOrderId) return; // Ignore if clicking the same order
      
      setSelectedOrderId(nextOrderId);
      setError('');
      await loadOrderDetail(shallowOrder);
    },
    [loadOrderDetail, selectedOrderId]
  );

  return useMemo(
    () => ({
      orders,
      selectedOrder,
      isListLoading,
      isDetailLoading,
      error,
      loadOrders,
      selectOrder,
    }),
    [error, isListLoading, isDetailLoading, loadOrders, orders, selectOrder, selectedOrder]
  );
}
