export const getOrderCode = (id) => `RO-${String(id).padStart(4, '0')}`;

export const mapOrderStatus = (status) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { text: 'Chờ thanh toán', color: 'text-[#a15c00]' };
    case 'PENDING_CONFIRMATION':
      return { text: 'Chờ xác nhận', color: 'text-[#99854e]' };
    case 'PICKED_UP':
      return { text: 'Đang vận chuyển', color: 'text-[#1c6b9a]' };
    case 'RETURNED':
      return { text: 'Hoàn thành', color: 'text-[#087b3f]' };
    case 'CANCELLED':
    case 'CANCELED':
      return { text: 'Đã hủy', color: 'text-gray-400' };
    default:
      return { text: status || 'Chờ xác nhận', color: 'text-gray-500' };
  }
};

export const getOrderTimeline = (order) => {
  const baseDate = new Date(order.rentalDate || order.createdAt || Date.now());
  const formatDate = (date, daysOffset, timeStr) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + daysOffset);
    return `${nextDate.getDate()} Thg ${nextDate.getMonth() + 1}, ${timeStr}`;
  };

  const timeline = [
    {
      status: 'Đã xác nhận',
      date: formatDate(baseDate, 0, '09:00'),
      icon: 'receipt_long',
      completed: true,
    },
  ];

  if (order.status === 'CANCELLED' || order.status === 'CANCELED' || order.status === 'Đã hủy') {
    timeline.push({
      status: 'Đã hủy',
      date: formatDate(baseDate, 0, '10:30'),
      icon: 'cancel',
      completed: true,
      current: true,
      isCanceled: true,
    });

    return timeline;
  }

  const isPreparing = order.status === 'PENDING_CONFIRMATION' || order.status === 'PENDING_PAYMENT';
  const isPreparingDone = ['PENDING_CONFIRMATION', 'PICKED_UP', 'RETURNED'].includes(order.status);
  timeline.push({
    status: 'Đang chuẩn bị',
    date: formatDate(baseDate, 0, '14:30'),
    icon: 'inventory_2',
    completed: isPreparingDone,
    current: isPreparing,
  });

  const isDelivering = order.status === 'PICKED_UP';
  const isDeliveringDone = ['PICKED_UP', 'RETURNED'].includes(order.status);
  timeline.push({
    status: 'Đang vận chuyển',
    date: formatDate(baseDate, 1, '08:15'),
    icon: 'local_shipping',
    completed: isDeliveringDone,
    current: isDelivering,
  });

  const isCompleted = order.status === 'RETURNED';
  timeline.push({
    status: 'Hoàn thành',
    date: isCompleted ? formatDate(baseDate, 3, '17:00') : `Dự kiến ${formatDate(baseDate, 2, '18:00').split(',')[0]}`,
    icon: 'check_circle',
    completed: isCompleted,
    current: isCompleted,
  });

  return timeline;
};
