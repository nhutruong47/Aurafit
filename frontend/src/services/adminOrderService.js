import { apiClient as api } from './http/apiClient';

export const adminOrderService = {
  getAllOrders: async (page = 0, size = 10, status = '', keyword = '') => {
    const params = new URLSearchParams({ page, size });
    if (status) params.append('status', status);
    if (keyword) params.append('keyword', keyword);
    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data?.data ?? response.data;
  },

  getOrderStatuses: async () => {
    return await api.get(`/admin/orders/statuses`);
  },

  getOrderDetail: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/management`);
    return response.data?.data ?? response.data;
  },

  shipOrder: async (orderId) => {
    const response = await api.post(`/admin/orders/${orderId}/ship`);
    return response.data;
  },

  markOrderRented: async (orderId) => {
    const response = await api.post(`/admin/orders/${orderId}/mark-rented`);
    return response.data;
  },

  markOrderReturned: async (orderId) => {
    const response = await api.post(`/admin/orders/${orderId}/mark-returned`);
    return response.data;
  },

  returnOrder: async (orderId) => {
    const response = await api.post(`/admin/orders/${orderId}/return`);
    return response.data;
  },

  completeOrder: async (orderId, payload) => {
    const response = await api.post(`/admin/orders/${orderId}/complete`, payload);
    return response.data;
  },

  handleDeliveryFailed: async (orderId, reason) => {
    const response = await api.post(`/admin/orders/${orderId}/delivery-failed`, null, { params: { reason } });
    return response.data;
  },

  handleLostPackage: async (orderId, reason) => {
    const response = await api.post(`/admin/orders/${orderId}/lost-package`, null, { params: { reason } });
    return response.data;
  },

  reportInvalidBank: async (orderId, inspectionPayload) => {
    const response = await api.post(`/admin/orders/${orderId}/report-invalid-bank`, inspectionPayload ?? null);
    return response.data;
  }
};
