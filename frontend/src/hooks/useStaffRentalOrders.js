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
  const [lateFee, setLateFee] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
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

  const maxDeposit = selectedDetail?.depositPrice || 0;
  const isPenaltyValid = (Number(lateFee) + Number(damageFee)) <= Number(maxDeposit);

  const activeTotals = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const confirmed = orders.filter((order) => order.status === 'CONFIRMED').length;
    
    let renting = 0;
    let overdue = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    orders.forEach((order) => {
      if (order.status === 'PICKED_UP') {
        let isOverdue = false;
        if (order.details && order.details.length > 0) {
          // Check if any detail is overdue
          isOverdue = order.details.some(d => new Date(d.rentalEndDate) < now);
        } else if (order.rentalEndDate) {
          isOverdue = new Date(order.rentalEndDate) < now;
        }
        
        if (isOverdue) {
          overdue++;
        } else {
          renting++;
        }
      }
    });

    const returned = orders.filter((order) => order.status === 'RETURNED').length;

    return { totalOrders, pending, confirmed, renting, overdue, returned };
  }, [orders]);

  const loadOrders = async (preferredOrderId = null) => {
    if (isLoading) return;
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
      setError(loadError.message || 'Hệ thống không thể truy xuất danh sách đơn hàng.');
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
        setError(loadError.message || 'Hệ thống không thể truy xuất danh sách đơn hàng.');
      } finally {
        if (mounted) {
          setIsLoading(false);
          setLoadedUserKey(requestKey);
        }
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
    setHandoverImageUrl('');
    setNote('');
    setLateFee(0);
    setDamageFee(0);
    setReturnStatus('RETURNED');

    if (!orderId) {
      setActiveOrder(null);
      setSelectedDetailId('');
      return;
    }

    try {
      const order = await fetchStaffOrder(orderId);
      setActiveOrder(order);
      setSelectedDetailId(order.details?.[0]?.id || '');
    } catch (loadError) {
      setError(loadError.message || 'Hệ thống không thể truy xuất chi tiết đơn hàng.');
    }
  };

  const handleHandoverImageUploaded = (asset) => {
    setHandoverImageUrl(asset?.secureUrl || '');
  };

  const submitHandover = async () => {
    if (!activeOrder || !selectedDetailId) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const payload = mode === 'PICKUP'
      ? {
          imageUrl: handoverImageUrl,
          note,
        }
      : {
          imageUrl: handoverImageUrl,
          note,
          assessments: [
            {
              rentalOrderDetailId: Number(selectedDetailId),
              returnStatus,
              lateFee: Math.max(0, Number(lateFee) || 0),
              damageFee: Math.max(0, Number(damageFee) || 0),
            }
          ]
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
      setLateFee(0);
      setDamageFee(0);
      setMessage(mode === 'PICKUP' ? 'Đã tạo biên bản bàn giao PICKUP.' : 'Đã ghi nhận khách trả đồ.');

      await loadOrders(activeOrder.id);
    } catch (submitError) {
      setError(submitError.message || 'Hệ thống gặp sự cố khi lưu biên bản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = (dateString) => {
      if (!dateString) return false;
      const d = new Date(dateString);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    };

    const isOverdue = (dateString) => {
      if (!dateString) return false;
      const d = new Date(dateString);
      d.setHours(0, 0, 0, 0);
      return d.getTime() < today.getTime();
    };

    return orders.filter(order => {
      if (['CANCELLED', 'COMPLETED', 'RETURNED'].includes(order.status)) return false;
      
      const pickupToday = order.status === 'CONFIRMED' && isToday(order.rentalStartDate);
      const returnToday = order.status === 'PICKED_UP' && isToday(order.rentalEndDate);
      const overdue = order.status === 'PICKED_UP' && isOverdue(order.rentalEndDate);

      return pickupToday || returnToday || overdue;
    }).sort((a, b) => {
      const aOverdue = a.status === 'PICKED_UP' && isOverdue(a.rentalEndDate);
      const bOverdue = b.status === 'PICKED_UP' && isOverdue(b.rentalEndDate);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const aReturn = a.status === 'PICKED_UP';
      const bReturn = b.status === 'PICKED_UP';
      if (aReturn && !bReturn) return -1;
      if (!aReturn && bReturn) return 1;

      return new Date(a.rentalStartDate) - new Date(b.rentalStartDate);
    });
  }, [orders]);

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
    lateFee,
    setLateFee,
    damageFee,
    setDamageFee,
    maxDeposit,
    isPenaltyValid,
    priorityOrders,
  };
}
