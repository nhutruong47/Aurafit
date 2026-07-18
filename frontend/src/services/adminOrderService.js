import { apiClient as api } from './http/apiClient';

export const adminOrderService = {
  getAllOrders: async (page = 0, size = 10, status = '') => {
    const params = new URLSearchParams({ page, size });
    if (status) params.append('status', status);
    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data;
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
  }
};
