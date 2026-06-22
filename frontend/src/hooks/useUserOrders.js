import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOrders } from '../services/ordersService';

export function useUserOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!currentUser?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchOrders();
      setOrders(data || []);
      setSelectedOrderId((currentId) => {
        if (data?.some((order) => order.id === currentId)) {
          return currentId;
        }
        return data?.[0]?.id ?? null;
      });
    } catch (err) {
      setError(err.message || 'Khong the tai danh sach lich su don hang.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const selectOrder = useCallback((order) => {
    setSelectedOrderId(order?.id ?? null);
  }, []);

  return {
    orders,
    selectedOrder,
    isLoading,
    error,
    loadOrders,
    selectOrder,
  };
}
