import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createPickupHandover,
  createReturnHandover,
  fetchStaffOrder,
  fetchStaffOrders,
  updateHandoverImage,
} from '../services/rentalOrderService';
import { getUserRoles } from '../utils/roles';

const getHandoverImageUrl = (handover) => (
  handover?.imageUrl || handover?.image_url || handover?.handoverImageUrl || handover?.secureUrl || handover?.secure_url || handover?.url || ''
).trim();

const hasHandoverImage = (handover) => Boolean(getHandoverImageUrl(handover));

const getHandoverMergeKey = (handover) => {
  if (handover?.id) return `id:${handover.id}`;
  return [
    handover?.handoverType || handover?.type || '',
    handover?.rentalOrderDetailId || '',
    handover?.createdAt || '',
    handover?.note || '',
  ].join(':');
};

const mergeHandoversWithFallback = (order, fallbackHandovers = []) => {
  if (!order || fallbackHandovers.length === 0) return order;

  const currentHandovers = Array.isArray(order.handovers) ? order.handovers : [];
  const mergedByKey = new Map(currentHandovers.map((handover) => [getHandoverMergeKey(handover), handover]));

  fallbackHandovers.forEach((fallbackHandover) => {
    if (!hasHandoverImage(fallbackHandover)) return;

    const key = getHandoverMergeKey(fallbackHandover);
    const currentHandover = mergedByKey.get(key);
    if (!currentHandover || !hasHandoverImage(currentHandover)) {
      mergedByKey.set(key, {
        ...currentHandover,
        ...fallbackHandover,
        imageUrl: getHandoverImageUrl(fallbackHandover),
      });
    }
  });

  return {
    ...order,
    handovers: Array.from(mergedByKey.values()),
  };
};

export function useStaffRentalOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [mode, setMode] = useState('PICKUP');
  const [assessments, setAssessments] = useState({});
  const [handoverImageUrl, setHandoverImageUrl] = useState('');
  const [note, setNote] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingHandoverImageType, setUpdatingHandoverImageType] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadedUserKey, setLoadedUserKey] = useState(null);
  const pickupImageDraftRef = useRef({ orderId: null, imageUrl: '' });
  const confirmedHandoverFallbackRef = useRef(new Map());

  const roles = getUserRoles(currentUser);
  const canUseStaffTools = roles.includes('STAFF') || roles.includes('ADMIN');
  const requestKey = currentUser?.id || '__guest__';

  const maxDeposit = (detailId) => {
    const detail = activeOrder?.details?.find(d => String(d.id) === String(detailId));
    return detail?.depositPrice || 0;
  };

  const isPenaltyValid = useMemo(() => {
    if (!activeOrder?.details) return true;
    return activeOrder.details.every(detail => {
      const ass = assessments[detail.id] || {};
      const maxD = detail.depositPrice || 0;
      return (Number(ass.lateFee) || 0) + (Number(ass.damageFee) || 0) <= Number(maxD);
    });
  }, [activeOrder, assessments]);

  const updateAssessment = (detailId, field, value) => {
    setAssessments(prev => ({
      ...prev,
      [detailId]: {
        ...(prev[detailId] || { returnStatus: 'RETURNED', lateFee: 0, damageFee: 0, note: '' }),
        [field]: value
      }
    }));
  };

  const applyConfirmedHandoverFallback = (order) => {
    const fallbackHandovers = confirmedHandoverFallbackRef.current.get(String(order?.id || '')) || [];
    return mergeHandoversWithFallback(order, fallbackHandovers);
  };

  const rememberConfirmedHandovers = (orderId, savedHandovers, payload, fallbackType) => {
    const savedList = Array.isArray(savedHandovers) ? savedHandovers : [];
    const fallbackImageUrl = (payload?.imageUrl || '').trim();
    const normalizedHandovers = savedList.length > 0
      ? savedList.map((handover) => ({
          ...handover,
          handoverType: handover?.handoverType || handover?.type || fallbackType,
          imageUrl: getHandoverImageUrl(handover) || fallbackImageUrl,
        }))
      : [{
          rentalOrderDetailId: Number(selectedDetailId),
          staffUserName: currentUser?.fullName || currentUser?.name || 'Nhân viên',
          handoverType: fallbackType,
          imageUrl: fallbackImageUrl,
          note: payload?.note || '',
          createdAt: new Date().toISOString(),
        }];

    if (normalizedHandovers.length === 0) return;

    const existing = confirmedHandoverFallbackRef.current.get(String(orderId)) || [];
    const mergedOrder = mergeHandoversWithFallback(
      { id: orderId, handovers: existing },
      normalizedHandovers
    );
    confirmedHandoverFallbackRef.current.set(String(orderId), mergedOrder.handovers);
  };

  const activeTotals = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const confirmed = orders.filter((order) => order.status === 'CONFIRMED').length;
    
    let renting = 0;
    let overdue = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    orders.forEach((order) => {
      if (order.status === 'RENTED' || order.status === 'SHIPPING' || order.status === 'PICKED_UP') {
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
      } else if (order.status === 'RETURNING') {
        overdue++; // Treat returning as "Chờ trả" as well
      }
    });

    const returned = orders.filter((order) => order.status === 'COMPLETED' || order.status === 'RETURNED').length;

    return { totalOrders, pending, confirmed, renting, overdue, returned };
  }, [orders]);

  const loadOrders = async (preferredOrderId = null) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const orderList = (await fetchStaffOrders()).map(applyConfirmedHandoverFallback);
      setOrders(orderList);

      const nextOrderId = preferredOrderId || activeOrderId || orderList[0]?.id || null;
      setActiveOrderId(nextOrderId);

      if (nextOrderId) {
        const order = applyConfirmedHandoverFallback(await fetchStaffOrder(nextOrderId));
        setActiveOrder(order);
        const initialAssessments = {};
        order.details?.forEach(d => {
          initialAssessments[d.id] = { returnStatus: 'RETURNED', lateFee: 0, damageFee: 0, note: '' };
        });
        setAssessments(initialAssessments);
      } else {
        setActiveOrder(null);
        setAssessments({});
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
        const orderList = (await fetchStaffOrders()).map(applyConfirmedHandoverFallback);
        if (!mounted) return;

        setOrders(orderList);
        const firstOrderId = orderList[0]?.id || null;
        setActiveOrderId(firstOrderId);

        if (firstOrderId) {
          const order = applyConfirmedHandoverFallback(await fetchStaffOrder(firstOrderId));
          if (!mounted) return;

          setActiveOrder(order);
          const initialAssessments = {};
          order.details?.forEach(d => {
            initialAssessments[d.id] = { returnStatus: 'RETURNED', lateFee: 0, damageFee: 0, note: '' };
          });
          setAssessments(initialAssessments);
        } else {
          setActiveOrder(null);
          setAssessments({});
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



  const openOrder = async (orderId, shouldResetHandoverDraft = true) => {
    setActiveOrderId(orderId);
    setError('');
    setMessage('');

    try {
      const order = applyConfirmedHandoverFallback(await fetchStaffOrder(orderId));
      setActiveOrder(order);
      if (shouldResetHandoverDraft) {
        const initialAssessments = {};
        order.details?.forEach(d => {
          initialAssessments[d.id] = { returnStatus: 'RETURNED', lateFee: 0, damageFee: 0, note: '' };
        });
        setAssessments(initialAssessments);
      }
      if (!shouldResetHandoverDraft && pickupImageDraftRef.current.orderId === order.id) {
        setHandoverImageUrl(pickupImageDraftRef.current.imageUrl);
      }
    } catch (loadError) {
      setError(loadError.message || 'Hệ thống không thể truy xuất chi tiết đơn hàng.');
    }
  };

  const handleHandoverImageUploaded = (asset) => {
    const uploadedImageUrl = (asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || '').trim();

    if (!uploadedImageUrl) {
      setError('Không nhận được URL ảnh sau khi tải lên. Vui lòng tải ảnh lại.');
      return;
    }

    setError('');
    pickupImageDraftRef.current = {
      orderId: activeOrder?.id || activeOrderId,
      imageUrl: uploadedImageUrl,
    };
    console.info('[Staff Pickup] Uploaded image URL', {
      orderId: pickupImageDraftRef.current.orderId,
      handoverImageUrl: uploadedImageUrl,
    });
    setHandoverImageUrl(uploadedImageUrl);
  };

  const submitHandover = async () => {
    if (!activeOrder) return;
    if (isSubmitting) return;

    const draftedHandoverImageUrl =
      pickupImageDraftRef.current.orderId === activeOrder.id
        ? pickupImageDraftRef.current.imageUrl
        : '';
    const submittedImageUrl = (handoverImageUrl || draftedHandoverImageUrl).trim();
    if (mode === 'PICKUP') {
      if (submittedImageUrl && handoverImageUrl !== submittedImageUrl) {
        setHandoverImageUrl(submittedImageUrl);
      }
      console.info('[Staff Pickup] Confirm Pickup image URL', {
        handoverImageUrl,
        draftedHandoverImageUrl,
        payloadImageUrl: submittedImageUrl,
      });
    }
    if (mode === 'PICKUP' && !submittedImageUrl) {
      setError('Vui lòng tải ảnh minh chứng trước khi xác nhận Pickup.');
      return;
    }
    if (mode === 'RETURN' && !submittedImageUrl) {
      setError('Vui lòng tải ảnh minh chứng trước khi xác nhận Return.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const payload = mode === 'PICKUP'
      ? {
          imageUrl: submittedImageUrl,
          note,
        }
      : {
          imageUrl: submittedImageUrl,
          note,
          assessments: activeOrder.details.map(detail => {
            const ass = assessments[detail.id] || { returnStatus: 'RETURNED', lateFee: 0, damageFee: 0, note: '' };
            return {
              rentalOrderDetailId: Number(detail.id),
              returnStatus: ass.returnStatus,
              lateFee: Math.max(0, Number(ass.lateFee) || 0),
              damageFee: Math.max(0, Number(ass.damageFee) || 0),
              note: ass.note || ''
            };
          })
        };

    if (mode === 'PICKUP') {
      console.info('[Staff Pickup] Confirm Pickup payload', {
        handoverImageUrl,
        payloadImageUrl: payload.imageUrl,
        payload,
      });
    }

    try {
      const savedHandovers = mode === 'PICKUP'
        ? await createPickupHandover(activeOrder.id, payload)
        : await createReturnHandover(activeOrder.id, payload);

      rememberConfirmedHandovers(activeOrder.id, savedHandovers, payload, mode);

      const refreshedOrder = applyConfirmedHandoverFallback(await fetchStaffOrder(activeOrder.id));
      setActiveOrder(refreshedOrder);
      pickupImageDraftRef.current = { orderId: null, imageUrl: '' };
      setHandoverImageUrl('');
      setNote('');
      setMessage(mode === 'PICKUP' ? 'Đã tạo biên bản bàn giao PICKUP.' : 'Đã ghi nhận khách trả đồ.');

      await loadOrders(activeOrder.id);
    } catch (submitError) {
      setError(submitError.message || 'Hệ thống gặp sự cố khi lưu biên bản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateHandoverEvidenceImage = async (handoverType, asset) => {
    if (!activeOrder?.id || updatingHandoverImageType) return;

    const imageUrl = getHandoverImageUrl(asset);
    if (!imageUrl) {
      setError('Không nhận được URL ảnh sau khi tải lên. Vui lòng tải ảnh lại.');
      return;
    }

    setUpdatingHandoverImageType(handoverType);
    setError('');
    setMessage('');

    try {
      const savedHandovers = await updateHandoverImage(activeOrder.id, handoverType, imageUrl);
      rememberConfirmedHandovers(activeOrder.id, savedHandovers, { imageUrl }, handoverType);

      const refreshedOrder = applyConfirmedHandoverFallback(await fetchStaffOrder(activeOrder.id));
      setActiveOrder(refreshedOrder);
      setOrders((currentOrders) => currentOrders.map((order) => (
        String(order.id) === String(refreshedOrder.id)
          ? applyConfirmedHandoverFallback({ ...order, handovers: refreshedOrder.handovers })
          : order
      )));
      setMessage(handoverType === 'PICKUP'
        ? 'Đã cập nhật ảnh minh chứng Pickup.'
        : 'Đã cập nhật ảnh minh chứng Return.');
    } catch (updateError) {
      setError(updateError.message || 'Không thể cập nhật ảnh minh chứng.');
    } finally {
      setUpdatingHandoverImageType('');
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
      const isRented = order.status === 'RENTED' || order.status === 'SHIPPING' || order.status === 'PICKED_UP';
      const isReturning = order.status === 'RETURNING';
      
      const returnToday = isRented && isToday(order.rentalEndDate);
      const overdue = isRented && isOverdue(order.rentalEndDate);

      return pickupToday || returnToday || overdue || isReturning;
    }).sort((a, b) => {
      const aIsRented = a.status === 'RENTED' || a.status === 'SHIPPING' || a.status === 'PICKED_UP';
      const bIsRented = b.status === 'RENTED' || b.status === 'SHIPPING' || b.status === 'PICKED_UP';

      const aOverdue = (aIsRented && isOverdue(a.rentalEndDate)) || a.status === 'RETURNING';
      const bOverdue = (bIsRented && isOverdue(b.rentalEndDate)) || b.status === 'RETURNING';
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const aReturn = aIsRented;
      const bReturn = bIsRented;
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
    handoverImageUrl,
    note,
    previewImage,
    isLoading: canUseStaffTools ? !loadedUserKey || loadedUserKey !== requestKey || isLoading : false,
    isSubmitting,
    updatingHandoverImageType,
    message,
    error,
    activeTotals,
    loadOrders,
    openOrder,
    setMode,
    setHandoverImageUrl,
    setNote,
    setPreviewImage,
    handleHandoverImageUploaded,
    updateHandoverEvidenceImage,
    submitHandover,
    assessments,
    updateAssessment,
    maxDeposit,
    isPenaltyValid,
    priorityOrders,
  };
}
