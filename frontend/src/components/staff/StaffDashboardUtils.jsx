import React from 'react';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN');
};

const detailStatusLabels = {
  PENDING: 'Chờ chuẩn bị',
  CONFIRMED: 'Chờ nhận',
  SHIPPING: 'Đang giao hàng',
  RENTED: 'Đang thuê',
  RETURNING: 'Đang hoàn trả',
  PICKED_UP: 'Đã nhận hàng',
  RETURNED: 'Đã trả',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const getDetailStatusLabel = (status) => detailStatusLabels[status] || status;

export const canShowPickupInfo = (status) => ['PICKED_UP', 'RETURNED', 'COMPLETED', 'DAMAGED', 'LOST'].includes(status);

const getEvidenceImageUrl = (handover) => (
  handover?.imageUrl || handover?.image_url || handover?.handoverImageUrl || handover?.secureUrl || handover?.secure_url || handover?.url || ''
).trim();

export const getStaffPickupInfo = (order) => {
  const pickupHandovers = (Array.isArray(order?.handovers) ? order.handovers : []).filter((handover) => {
    const handoverType = String(handover?.handoverType || '').toUpperCase();
    return handoverType === 'PICKUP';
  });
  const pickupHandover = pickupHandovers[0];
  const pickupImages = pickupHandovers
    .map(getEvidenceImageUrl)
    .filter(Boolean)
    .map((imageUrl) => String(imageUrl).trim())
    .filter(Boolean)
    .filter((imageUrl, index, images) => images.indexOf(imageUrl) === index);
  const pickupNote = pickupHandovers
    .map((handover) => handover?.note)
    .find((note) => note && String(note).trim()) ?? '';

  return {
    pickedUpAt: pickupHandover?.createdAt || '',
    pickedUpBy: pickupHandover?.staffUserName || '',
    pickupNote,
    pickupImages,
    canUpdateImage: pickupHandovers.length > 0,
  };
};

export const getStaffReturnInfo = (order) => {
  const returnHandovers = (Array.isArray(order?.handovers) ? order.handovers : []).filter((handover) => {
    const handoverType = String(handover?.handoverType || '').toUpperCase();
    return handoverType === 'RETURN';
  });
  const returnHandover = returnHandovers[0];
  const returnImages = returnHandovers
    .map(getEvidenceImageUrl)
    .filter(Boolean)
    .map((imageUrl) => String(imageUrl).trim())
    .filter(Boolean)
    .filter((imageUrl, index, images) => images.indexOf(imageUrl) === index);
  const returnNote = returnHandovers
    .map((handover) => handover?.note)
    .find((note) => note && String(note).trim()) ?? '';

  return {
    returnedAt: returnHandover?.createdAt || '',
    returnedBy: returnHandover?.staffUserName || '',
    returnNote,
    returnImages,
    canUpdateImage: returnHandovers.length > 0,
  };
};

export const StatusBadge = ({ status, label }) => {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SHIPPING: 'bg-indigo-100 text-indigo-800',
    RENTED: 'bg-purple-100 text-purple-800',
    RETURNING: 'bg-pink-100 text-pink-800',
    PICKED_UP: 'bg-indigo-100 text-indigo-800',
    RETURNED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    DAMAGED: 'bg-orange-100 text-orange-800',
    LOST: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {label || status}
    </span>
  );
};
