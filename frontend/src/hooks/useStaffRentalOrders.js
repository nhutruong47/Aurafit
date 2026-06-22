import { useEffect, useMemo, useState } from 'react';
import {
  createPickupHandover,
  createReturnHandover,
  fetchStaffOrder,
  fetchStaffOrders,
} from '../services/rentalOrderService';
import { getUserRoles } from '../utils/roles';

export function useStaffRentalOrders(currentUser) {
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
    const waiting = orders.filter((order) => order.status === 'PENDING' || order.status === 'CONFIRMED').length;
    return { totalOrders, pickedUp, returned, waiting };
  }, [orders]);

  const loadOrders = async (preferredOrderId = null) => {
    setIsLoading(true);

    try {
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

      setError('');
      setLoadedUserKey(requestKey);
    } catch (loadError) {
      setError(loadError.message || 'Khong the tai danh sach don.');
      setLoadedUserKey(requestKey);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canUseStaffTools) return;

    let mounted = true;

    const bootstrap = async () => {
      setIsLoading(true);

      try {
        const orderList = await fetchStaffOrders();
        if (!mounted) return;

        setOrders(orderList);
        const firstOrderId = orderList[0]?.id || null;
        setActiveOrderId(firstOrderId);

        if (firstOrderId) {
          const order = await fetchStaffOrder(firstOrderId);
          if (!mounted) return;

          setActiveOrder(order);
          setSelectedDetailId(order.details?.[0]?.id || '');
        } else {
          setActiveOrder(null);
          setSelectedDetailId('');
        }

        setError('');
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError.message || 'Khong the tai danh sach don.');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
        setLoadedUserKey(requestKey);
      }
    };

    bootstrap();

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
      setError(loadError.message || 'Khong the tai chi tiet don.');
    }
  };

  const handleHandoverImageUploaded = (asset) => {
    setHandoverImageUrl(asset?.secureUrl || '');
  };

  const submitHandover = async () => {
    if (!activeOrder || !selectedDetailId) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const payload = {
      rentalOrderDetailId: Number(selectedDetailId),
      imageUrl: handoverImageUrl,
      note,
      ...(mode === 'RETURN' ? { returnStatus } : {}),
    };

    try {
      if (mode === 'PICKUP') {
        await createPickupHandover(activeOrder.id, payload);
      } else {
        await createReturnHandover(activeOrder.id, payload);
      }

      const refreshedOrder = await fetchStaffOrder(activeOrder.id);
      setActiveOrder(refreshedOrder);
      setSelectedDetailId(refreshedOrder.details?.[0]?.id || '');
      setHandoverImageUrl('');
      setNote('');
      setMessage(mode === 'PICKUP' ? 'Da tao bien ban ban giao PICKUP.' : 'Da ghi nhan khach tra do.');

      await loadOrders(activeOrder.id);
    } catch (submitError) {
      setError(submitError.message || 'Khong the luu bien ban.');
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
    handleHandoverImageUploaded,
    submitHandover,
  };
}
