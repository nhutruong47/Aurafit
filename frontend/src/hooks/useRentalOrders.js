import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOrderDetail, fetchOrders } from '../services/rentalOrderService';

export function useRentalOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  const loadOrderDetail = useCallback(async (orderId) => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }

    setIsLoadingDetail(true);

    try {
      const detail = await fetchOrderDetail(orderId);
      setSelectedOrder(detail || null);
    } catch (err) {
      setError(err.message || 'Hệ thống không thể truy xuất chi tiết đơn hàng.');
      setSelectedOrder(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!currentUser?.id) {
      setOrders([]);
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchOrders();
      const nextOrders = Array.isArray(data) ? data : [];
      setOrders(nextOrders);

      const nextSelectedOrderId = nextOrders.some((order) => order.id === selectedOrderId)
        ? selectedOrderId
        : nextOrders[0]?.id ?? null;

      setSelectedOrderId(nextSelectedOrderId);
      await loadOrderDetail(nextSelectedOrderId);
    } catch (err) {
      setError(err.message || 'Hệ thống không thể truy xuất danh sách lịch sử đơn hàng.');
      setOrders([]);
      setSelectedOrderId(null);
      setSelectedOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, loadOrderDetail, selectedOrderId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const selectOrder = useCallback(
    async (order) => {
      const nextOrderId = order?.id ?? null;
      setSelectedOrderId(nextOrderId);
      setError('');
      await loadOrderDetail(nextOrderId);
    },
    [loadOrderDetail]
  );

  return useMemo(
    () => ({
      orders,
      selectedOrder,
      isLoading: isLoading || isLoadingDetail,
      error,
      loadOrders,
      selectOrder,
    }),
    [error, isLoading, isLoadingDetail, loadOrders, orders, selectOrder, selectedOrder]
  );
}
