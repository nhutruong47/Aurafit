export const getOrderCode = (id) => `RO-${String(id).padStart(4, '0')}`;

export const mapOrderStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return { text: 'Cho thanh toan', color: 'text-[#a15c00]' };
    case 'CONFIRMED':
      return { text: 'Da xac nhan', color: 'text-[#99854e]' };
    case 'PICKED_UP':
      return { text: 'Da ban giao', color: 'text-[#1c6b9a]' };
    case 'RETURNED':
      return { text: 'Da tra do', color: 'text-[#087b3f]' };
    case 'COMPLETED':
      return { text: 'Hoan thanh', color: 'text-[#087b3f]' };
    case 'CANCELLED':
      return { text: 'Da huy', color: 'text-gray-400' };
    default:
      return { text: status || 'Dang cap nhat', color: 'text-gray-500' };
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
      status: 'Don duoc tao',
      date: formatMoment(order?.createdAt, 'Dang cap nhat'),
      icon: 'receipt_long',
      completed: true,
      current: status === 'PENDING',
    },
    {
      status: isCancelled ? 'Don da huy' : 'Xac nhan thanh toan',
      date: isCancelled
        ? formatMoment(order?.createdAt, 'Da huy')
        : formatMoment(order?.createdAt, 'Cho xac nhan'),
      icon: isCancelled ? 'cancel' : 'verified',
      completed: isCancelled || isConfirmed,
      current: !isCancelled && status === 'CONFIRMED',
      isCanceled: isCancelled,
    },
    {
      status: 'Ban giao trang phuc',
      date: formatMoment(order?.rentalStartDate, 'Cho ngay ban giao'),
      icon: 'local_shipping',
      completed: isPickedUp,
      current: status === 'PICKED_UP',
    },
    {
      status: 'Khach tra do',
      date: formatMoment(order?.rentalEndDate, 'Cho ngay tra do'),
      icon: 'assignment_return',
      completed: isReturned,
      current: status === 'RETURNED',
    },
    {
      status: 'Hoan tat don hang',
      date: formatMoment(order?.rentalEndDate, 'Cho hoan tat'),
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
