export const getOrderCode = (id) => `RO-${String(id).padStart(4, '0')}`;

export const mapOrderStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return { text: 'Chờ thanh toán', color: 'text-[#a15c00]' };
    case 'CONFIRMED':
      return { text: 'Đã xác nhận', color: 'text-[#99854e]' };
    case 'PICKED_UP':
      return { text: 'Đã bàn giao', color: 'text-[#1c6b9a]' };
    case 'RETURNED':
      return { text: 'Đã trả đồ', color: 'text-[#087b3f]' };
    case 'COMPLETED':
      return { text: 'Hoàn thành', color: 'text-[#087b3f]' };
    case 'CANCELLED':
      return { text: 'Đã hủy', color: 'text-gray-400' };
    default:
      return { text: status || 'Đang cập nhật', color: 'text-gray-500' };
  }
};

const formatMoment = (value, fallbackLabel) => {
  if (!value) return fallbackLabel;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackLabel;

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getOrderTimeline = (order) => {
  const status = order?.status;
  const isCancelled = status === 'CANCELLED';
  const isConfirmed = ['CONFIRMED', 'PICKED_UP', 'RETURNED', 'COMPLETED'].includes(status);
  const isPickedUp = ['PICKED_UP', 'RETURNED', 'COMPLETED'].includes(status);
  const isReturned = ['RETURNED', 'COMPLETED'].includes(status);
  const isCompleted = status === 'COMPLETED';

  const timeline = [
    {
      status: 'Đơn được tạo',
      date: formatMoment(order?.createdAt, 'Đang cập nhật'),
      icon: 'receipt_long',
      completed: true,
      current: status === 'PENDING',
    },
    {
      status: isCancelled ? 'Đơn đã hủy' : 'Xác nhận thanh toán',
      date: isCancelled
        ? formatMoment(order?.createdAt, 'Đã hủy')
        : formatMoment(order?.createdAt, 'Chờ xác nhận'),
      icon: isCancelled ? 'cancel' : 'verified',
      completed: isCancelled || isConfirmed,
      current: !isCancelled && status === 'CONFIRMED',
      isCanceled: isCancelled,
    },
    {
      status: 'Bàn giao trang phục',
      date: formatMoment(order?.rentalStartDate, 'Chờ ngày bàn giao'),
      icon: 'local_shipping',
      completed: isPickedUp,
      current: status === 'PICKED_UP',
    },
    {
      status: 'Khách trả đồ',
      date: formatMoment(order?.rentalEndDate, 'Chờ ngày trả đồ'),
      icon: 'assignment_return',
      completed: isReturned,
      current: status === 'RETURNED',
    },
    {
      status: 'Hoàn tất đơn hàng',
      date: formatMoment(order?.rentalEndDate, 'Chờ hoàn tất'),
      icon: 'check_circle',
      completed: isCompleted,
      current: isCompleted,
    },
  ];

  if (isCancelled) {
    return timeline.slice(0, 2);
  }

  return timeline;
};
