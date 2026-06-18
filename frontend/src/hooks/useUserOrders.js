import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchStaffOrders } from '../services/api';

export function useUserOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const targetEmail = currentUser?.email || 'customer@aurafit.vn';

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchStaffOrders();
      const userOrders = data.filter((order) => order.customerEmail === targetEmail);

      setOrders(userOrders);
      setSelectedOrderId((currentId) => {
        if (userOrders.some((order) => order.id === currentId)) {
          return currentId;
        }

        return userOrders[0]?.id ?? null;
      });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lịch sử đơn hàng.');
    } finally {
      setIsLoading(false);
    }
  }, [targetEmail]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
