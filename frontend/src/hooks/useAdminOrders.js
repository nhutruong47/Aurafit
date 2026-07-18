import { useCallback, useEffect, useState } from 'react';
import { adminOrderService } from '../services/adminOrderService';

const getOrderErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export function useAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await adminOrderService.getAllOrders(page, 10, status, keyword.trim());
      setOrders(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (loadError) {
      setOrders([]);
      setTotalPages(0);
      setTotalElements(0);
      setError(getOrderErrorMessage(loadError, 'Không thể tải danh sách đơn hàng.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, status, keyword]);

  useEffect(() => {
    const timerId = window.setTimeout(loadOrders, keyword ? 300 : 0);
    return () => window.clearTimeout(timerId);
  }, [loadOrders, keyword]);

  const changeStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(0);
  };

  const changeKeyword = (nextKeyword) => {
    setKeyword(nextKeyword);
    setPage(0);
  };

  const openOrder = async (orderId) => {
    setIsLoadingDetail(true);
    setError('');

    try {
      const order = await adminOrderService.getOrderDetail(orderId);
      setSelectedOrder(order);
    } catch (detailError) {
      setError(getOrderErrorMessage(detailError, 'Không thể tải chi tiết đơn hàng.'));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return {
    orders,
    page,
    status,
    keyword,
    totalPages,
    totalElements,
    selectedOrder,
    isLoading,
    isLoadingDetail,
    error,
    setPage,
    changeStatus,
    changeKeyword,
    setSelectedOrder,
    loadOrders,
    openOrder,
  };
}
