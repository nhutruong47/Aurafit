import { useEffect, useMemo, useState } from 'react';
import {
  createPickupHandover,
  createReturnHandover,
  fetchStaffOrder,
  fetchStaffOrders,
} from '../services/ordersService';
import { getUserRoles } from '../utils/roles';

export function useStaffOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [mode, setMode] = useState('PICKUP');
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const [returnStatus, setReturnStatus] = useState('RETURNED');
  const [handoverImageUrl, setHandoverImageUrl] = useState('');
  const [note, setNote] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadedUserKey, setLoadedUserKey] = useState(null);

  const roles = getUserRoles(currentUser);
  const canUseStaffTools = roles.includes('STAFF') || roles.includes('ADMIN');
  const requestKey = currentUser?.id || '__guest__';

  const selectedDetail = useMemo(
    () => activeOrder?.details?.find((detail) => String(detail.id) === String(selectedDetailId)),
    [activeOrder, selectedDetailId]
  );

  const activeTotals = useMemo(() => {
    const totalOrders = orders.length;
    const pickedUp = orders.filter((order) => order.status === 'PICKED_UP').length;
    const returned = orders.filter((order) => order.status === 'RETURNED').length;
    const waiting = orders.filter((order) => order.status === 'PENDING_CONFIRMATION').length;
    return { totalOrders, pickedUp, returned, waiting };
  }, [orders]);

  const loadOrders = async (preferredOrderId = null) => {
    const orderList = await fetchStaffOrders();
    setOrders(orderList);
    const nextOrderId = preferredOrderId || activeOrderId || orderList[0]?.id || null;
    setActiveOrderId(nextOrderId);
    if (nextOrderId) {
      const order = await fetchStaffOrder(nextOrderId);
      setActiveOrder(order);
      setSelectedDetailId(order.details?.[0]?.id || '');
    } else {
      setActiveOrder(null);
      setSelectedDetailId('');
    }
  };

  useEffect(() => {
    if (!canUseStaffTools) return;

    let mounted = true;

    fetchStaffOrders()
      .then(async (orderList) => {
        if (!mounted) return;
        setOrders(orderList);
        const firstOrderId = orderList[0]?.id || null;
        setActiveOrderId(firstOrderId);
        if (firstOrderId) {
          const order = await fetchStaffOrder(firstOrderId);
          if (!mounted) return;
          setActiveOrder(order);
          setSelectedDetailId(order.details?.[0]?.id || '');
        }
        setError('');
        setIsLoading(false);
        setLoadedUserKey(requestKey);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError.message || 'Không thể tải danh sách đơn.');
        setIsLoading(false);
        setLoadedUserKey(requestKey);
      });

    return () => {
      mounted = false;
    };
  }, [canUseStaffTools, requestKey]);

  const openOrder = async (orderId) => {
    setActiveOrderId(orderId);
    setError('');
    setMessage('');
    try {
      const order = await fetchStaffOrder(orderId);
      setActiveOrder(order);
      setSelectedDetailId(order.details?.[0]?.id || '');
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải chi tiết đơn.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setHandoverImageUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const submitHandover = async () => {
    if (!activeOrder || !selectedDetailId || !currentUser?.id) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const payload = {
      staffUserId: currentUser.id,
      rentalOrderDetailId: Number(selectedDetailId),
      handoverImageUrl,
      note,
      returnStatus: mode === 'RETURN' ? returnStatus : null,
    };

    try {
      const updatedOrder =
        mode === 'PICKUP'
          ? await createPickupHandover(activeOrder.id, payload)
          : await createReturnHandover(activeOrder.id, payload);

      setActiveOrder(updatedOrder);
      setSelectedDetailId(updatedOrder.details?.[0]?.id || '');
      setHandoverImageUrl('');
      setNote('');
      setMessage(mode === 'PICKUP' ? 'Đã tạo biên bản bàn giao PICKUP.' : 'Đã ghi nhận khách trả đồ.');
      await loadOrders(updatedOrder.id);
    } catch (submitError) {
      setError(submitError.message || 'Không thể lưu biên bản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    canUseStaffTools,
    orders,
    activeOrderId,
    activeOrder,
    mode,
    selectedDetailId,
    selectedDetail,
    returnStatus,
    handoverImageUrl,
    note,
    previewImage,
    isLoading: canUseStaffTools ? !loadedUserKey || loadedUserKey !== requestKey || isLoading : false,
    isSubmitting,
    message,
    error,
    activeTotals,
    loadOrders,
    openOrder,
    setMode,
    setSelectedDetailId,
    setReturnStatus,
    setHandoverImageUrl,
    setNote,
    setPreviewImage,
    handleFileChange,
    submitHandover,
  };
}
