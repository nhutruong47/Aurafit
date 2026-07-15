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
        depositPrice: Number(detail?.depositPrice ?? detail?.deposit ?? 0),
      }))
    : [],
});

const normalizeStaffOrderDetailItem = (detail) => ({
  ...detail,
  skuCode: detail?.skuCode || detail?.sku || '',
  costumeImageUrl: detail?.costumeImageUrl || detail?.imageUrl || '',
  rentalPrice: Number(detail?.rentalPrice ?? detail?.pricePerDay ?? 0),
  depositPrice: Number(detail?.depositPrice ?? detail?.deposit ?? 0),
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
          handoverType: handover?.handoverType || handover?.type || '',
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
  const payload = await requestJson(
    { url: '/orders', method: 'GET' },
    'Hệ thống không thể truy xuất danh sách lịch sử đơn hàng.'
  );
  return Array.isArray(payload) ? payload.map(normalizeOrderSummary) : [];
};

export const createOrder = async (orderData) =>
  requestJson(
    {
      url: '/orders',
      method: 'POST',
      data: orderData,
    },
    'Không thể tạo đơn hàng.'
  );

export const cancelOrder = async (orderId, cancelReason) => {
  const url = cancelReason 
    ? `/orders/${encodeURIComponent(orderId)}/cancel?cancelReason=${encodeURIComponent(cancelReason)}`
    : `/orders/${encodeURIComponent(orderId)}/cancel`;
    
  return requestJson(
    {
      url,
      method: 'PUT',
    },
    'Không thể hủy đơn hàng.'
  );
};

export const fetchOrderDetail = async (orderId) =>
  requestJson(
    { url: `/orders/${encodeURIComponent(orderId)}`, method: 'GET' },
    'Hệ thống không thể truy xuất chi tiết đơn hàng.'
  ).then(normalizeOrderDetail);

export const fetchStaffOrders = async () => {
  const payload = await requestJson(
    { url: '/orders/management', method: 'GET' },
    'Không thể tải danh sách đơn cho staff.'
  );
  return Array.isArray(payload) ? payload.map(normalizeStaffOrder) : [];
};

export const fetchStaffOrder = async (orderId) => {
  const payload = await requestJson(
    { url: `/orders/${encodeURIComponent(orderId)}/management`, method: 'GET' },
    'Không thể tải chi tiết đơn cho staff.'
  );
  return normalizeStaffOrder(payload);
};

export const createPickupHandover = async (orderId, handoverData) =>
  requestJson(
    {
      url: `/orders/${encodeURIComponent(orderId)}/pickup-handovers`,
      method: 'POST',
      data: handoverData,
    },
    'Không thể lưu biên bản bàn giao.'
  );

export const createReturnHandover = async (orderId, handoverData) =>
  requestJson(
    {
      url: `/orders/${encodeURIComponent(orderId)}/return-handovers`,
      method: 'POST',
      data: handoverData,
    },
    'Không thể lưu biên bản trả đồ.'
  );

export const updateHandoverImage = async (orderId, handoverType, imageUrl) =>
  requestJson(
    {
      url: `/orders/${encodeURIComponent(orderId)}/handovers/${encodeURIComponent(handoverType)}/image`,
      method: 'PATCH',
      data: { imageUrl },
    },
    'Không thể cập nhật ảnh minh chứng.'
  );
