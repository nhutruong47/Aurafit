import { requestJson } from './http/request';

const normalizeOrderSummary = (order) => ({
  ...order,
  totalRentalFee: Number(order?.totalRentalFee ?? order?.totalRentalPrice ?? 0),
});

const normalizeOrderDetail = (order) => ({
  ...order,
  totalRentalFee: Number(order?.totalRentalFee ?? order?.totalRentalPrice ?? 0),
  details: Array.isArray(order?.details)
    ? order.details.map((detail) => ({
        ...detail,
        skuCode: detail?.skuCode || detail?.sku || '',
        rentalPrice: Number(detail?.rentalPrice ?? detail?.pricePerDay ?? 0),
        depositPrice: Number(detail?.depositPrice ?? 0),
      }))
    : [],
});

const normalizeStaffOrderDetailItem = (detail) => ({
  ...detail,
  costumeImageUrl: detail?.costumeImageUrl || detail?.imageUrl || '',
});

const normalizeStaffOrder = (order) => {
  const details = Array.isArray(order?.details) ? order.details.map(normalizeStaffOrderDetailItem) : [];
  const detailById = new Map(details.map((detail) => [String(detail.id), detail]));
  const handovers = Array.isArray(order?.handovers)
    ? order.handovers.map((handover) => {
        const matchedDetail = detailById.get(String(handover?.rentalOrderDetailId));

        return {
          ...handover,
          type: handover?.type || handover?.handoverType || '',
          staffName: handover?.staffName || handover?.staffUserName || '',
          handoverImageUrl: handover?.handoverImageUrl || handover?.imageUrl || '',
          costumeName: handover?.costumeName || matchedDetail?.costumeName || '',
          skuCode: handover?.skuCode || matchedDetail?.skuCode || '',
        };
      })
    : [];

  return {
    ...order,
    details,
    handovers,
  };
};

export const fetchOrders = async () => {
  const payload = await requestJson({ url: '/orders', method: 'GET' });
  return Array.isArray(payload) ? payload.map(normalizeOrderSummary) : [];
};

export const createOrder = async (orderData) =>
  requestJson({
    url: '/orders/checkout',
    method: 'POST',
    data: orderData,
  });

export const fetchOrderDetail = async (orderId) =>
  requestJson({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'GET' }).then(normalizeOrderDetail);

export const fetchOrderTimeline = async (orderId) =>
  requestJson({ url: `/orders/${encodeURIComponent(orderId)}/timeline`, method: 'GET' });

export const fetchStaffOrders = async () => {
  const payload = await requestJson({ url: '/orders/staff', method: 'GET' });
  return Array.isArray(payload) ? payload.map(normalizeStaffOrder) : [];
};

export const fetchStaffOrder = async (orderId) => {
  const payload = await requestJson({ url: `/orders/staff/${encodeURIComponent(orderId)}`, method: 'GET' });
  return normalizeStaffOrder(payload);
};

export const createPickupHandover = async (orderId, handoverData) =>
  requestJson({
    url: `/orders/${encodeURIComponent(orderId)}/handover/pickup`,
    method: 'POST',
    data: handoverData,
  });

export const createReturnHandover = async (orderId, handoverData) =>
  requestJson({
    url: `/orders/${encodeURIComponent(orderId)}/handover/return`,
    method: 'POST',
    data: handoverData,
  });
