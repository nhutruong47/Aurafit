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
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
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
  PENDING_REFUND: 'Chờ giải ngân',
  NOT_RETURNED: 'Chưa trả',
  RETURNED_GOOD: 'Bình thường',
  DAMAGED: 'Hư hỏng',
  LOST: 'Thất lạc',
  LATE: 'Trễ hạn',
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ chuẩn bị (Pending)' },
  { value: 'CONFIRMED', label: 'Chờ bàn giao (Confirmed)' },
  { value: 'SHIPPING', label: 'Đang giao hàng (Shipping)' },
  { value: 'RENTED', label: 'Đang thuê (Rented)' },
  { value: 'RETURNING', label: 'Đang hoàn trả (Returning)' },
  { value: 'RETURNED', label: 'Đã trả (Returned)' },
  { value: 'PENDING_REFUND', label: 'Chờ giải ngân (Pending Refund)' },
  { value: 'COMPLETED', label: 'Hoàn thành (Completed)' },
  { value: 'CANCELLED', label: 'Đã hủy (Cancelled)' }
];

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
    PENDING: 'border border-[#7f7041] bg-[#fdfdfb] text-[#7f7041]',
    CONFIRMED: 'border border-blue-200 bg-blue-50 text-blue-700',
    SHIPPING: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
    RENTED: 'border border-[#d7d2c8] bg-[#111111] text-white',
    RETURNING: 'border border-pink-200 bg-pink-50 text-pink-700',
    PICKED_UP: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
    RETURNED: 'border border-green-200 bg-green-50 text-green-700',
    COMPLETED: 'border border-green-200 bg-green-50 text-green-700',
    CANCELLED: 'border border-[#d7d2c8] bg-[#f4f4f2] text-[#171717]',
    NOT_RETURNED: 'border border-orange-200 bg-orange-50 text-orange-700',
    RETURNED_GOOD: 'border border-green-200 bg-green-50 text-green-700',
    DAMAGED: 'border border-orange-200 bg-orange-50 text-orange-700',
    LOST: 'border border-red-200 bg-red-50 text-red-700',
    LATE: 'border border-yellow-200 bg-yellow-50 text-yellow-800',
  };
  return (
    <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || 'border border-[#d7d2c8] bg-[#f4f4f2] text-[#171717]'}`}>
      {label || status}
    </span>
  );
};
