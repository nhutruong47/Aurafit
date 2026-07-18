export const getOrderCode = (id) => `RO-${String(id).padStart(4, '0')}`;

export const mapOrderStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return { text: 'Chờ thanh toán', color: 'text-[#a15c00]' };
    case 'CONFIRMED':
      return { text: 'Đã xác nhận', color: 'text-[#99854e]' };
    case 'SHIPPING':
      return { text: 'Đang giao hàng', color: 'text-[#1c6b9a]' };
    case 'PICKED_UP':
      return { text: 'Đã bàn giao', color: 'text-[#1c6b9a]' };
    case 'RENTED':
      return { text: 'Đang thuê', color: 'text-[#7f7041]' };
    case 'RETURNING':
      return { text: 'Đang thu hồi', color: 'text-[#1c6b9a]' };
    case 'RETURNED':
      return { text: 'Đã trả đồ', color: 'text-[#087b3f]' };
    case 'PENDING_REFUND':
      return { text: 'Chờ giải ngân', color: 'text-[#a15c00]' };
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

// Ordered status progression for each delivery method
const PICKUP_FLOW = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RENTED', 'RETURNED', 'PENDING_REFUND', 'COMPLETED'];
const SHIPPING_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPING', 'RENTED', 'RETURNING', 'RETURNED', 'PENDING_REFUND', 'COMPLETED'];

const isAtOrPast = (currentStatus, targetStatus, flow) => {
  const currentIdx = flow.indexOf(currentStatus);
  const targetIdx = flow.indexOf(targetStatus);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return currentIdx >= targetIdx;
};

export const getOrderTimeline = (order) => {
  const status = order?.status;
  const isCancelled = status === 'CANCELLED';
  const isGHN = order?.deliveryMethod === 'GHN_DELIVERY';
  const flow = isGHN ? SHIPPING_FLOW : PICKUP_FLOW;

  // Build steps based on delivery method
  const pickupSteps = [
    { key: 'PENDING',    label: 'Đơn được tạo',           icon: 'receipt_long',     dateFn: () => formatMoment(order?.createdAt, 'Đang cập nhật') },
    { key: 'CONFIRMED',  label: 'Xác nhận thanh toán',    icon: 'verified',         dateFn: () => formatMoment(order?.createdAt, 'Chờ xác nhận') },
    { key: 'PICKED_UP',  label: 'Lấy hàng tại cửa hàng', icon: 'storefront',       dateFn: () => formatMoment(order?.rentalStartDate, 'Chờ ngày lấy hàng') },
    { key: 'RENTED',     label: 'Đang thuê',              icon: 'checkroom',        dateFn: () => formatMoment(order?.rentalStartDate, 'Chờ bàn giao') },
    { key: 'RETURNED',   label: 'Đã trả đồ',             icon: 'assignment_return', dateFn: () => formatMoment(order?.rentalEndDate, 'Chờ trả đồ') },
    { key: 'PENDING_REFUND', label: 'Chờ giải ngân',      icon: 'account_balance',  dateFn: () => 'Đang xử lý hoàn cọc' },
    { key: 'COMPLETED',  label: 'Hoàn tất đơn hàng',      icon: 'check_circle',     dateFn: () => formatMoment(order?.rentalEndDate, 'Chờ hoàn tất') },
  ];

  const shippingSteps = [
    { key: 'PENDING',    label: 'Đơn được tạo',           icon: 'receipt_long',     dateFn: () => formatMoment(order?.createdAt, 'Đang cập nhật') },
    { key: 'CONFIRMED',  label: 'Xác nhận thanh toán',    icon: 'verified',         dateFn: () => formatMoment(order?.createdAt, 'Chờ xác nhận') },
    { key: 'SHIPPING',   label: 'Đang giao hàng (GHN)',   icon: 'local_shipping',   dateFn: () => formatMoment(order?.rentalStartDate, 'Chờ giao hàng') },
    { key: 'RENTED',     label: 'Đang thuê',              icon: 'checkroom',        dateFn: () => formatMoment(order?.rentalStartDate, 'Chờ nhận hàng') },
    { key: 'RETURNING',  label: 'Đang thu hồi (GHN)',     icon: 'local_shipping',   dateFn: () => formatMoment(order?.rentalEndDate, 'Chờ thu hồi') },
    { key: 'RETURNED',   label: 'Đã trả đồ',             icon: 'assignment_return', dateFn: () => formatMoment(order?.rentalEndDate, 'Chờ xác nhận') },
    { key: 'PENDING_REFUND', label: 'Chờ giải ngân',      icon: 'account_balance',  dateFn: () => 'Đang xử lý hoàn cọc' },
    { key: 'COMPLETED',  label: 'Hoàn tất đơn hàng',      icon: 'check_circle',     dateFn: () => formatMoment(order?.rentalEndDate, 'Chờ hoàn tất') },
  ];

  const rawSteps = isGHN ? shippingSteps : pickupSteps;

  // If not PENDING_REFUND and not COMPLETED, remove the PENDING_REFUND step to keep timeline clean
  const shouldShowPendingRefund = isAtOrPast(status, 'PENDING_REFUND', flow);
  const steps = shouldShowPendingRefund
    ? rawSteps
    : rawSteps.filter(s => s.key !== 'PENDING_REFUND');

  // Handle cancelled orders
  if (isCancelled) {
    return [
      {
        status: 'Đơn được tạo',
        date: formatMoment(order?.createdAt, 'Đang cập nhật'),
        icon: 'receipt_long',
        completed: true,
        current: false,
      },
      {
        status: 'Đơn đã hủy',
        date: formatMoment(order?.createdAt, 'Đã hủy'),
        icon: 'cancel',
        completed: true,
        current: true,
        isCanceled: true,
      },
    ];
  }

  return steps.map((step) => {
    const completed = isAtOrPast(status, step.key, flow);
    const current = status === step.key;

    // Special warning styling for PENDING_REFUND
    const isWarning = step.key === 'PENDING_REFUND' && current;

    return {
      status: step.label,
      date: step.dateFn(),
      icon: step.icon,
      completed,
      current,
      isWarning,
    };
  });
};
