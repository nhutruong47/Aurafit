import api from './http/api';

export const adminOrderService = {
  getAllOrders: async (page = 0, size = 10, status = '') => {
    const params = new URLSearchParams({ page, size });
    if (status) params.append('status', status);
    const response = await api.get(`/api/admin/orders?${params.toString()}`);
    return response.data;
  },

  shipOrder: async (orderId) => {
    const response = await api.post(`/api/admin/orders/${orderId}/ship`);
    return response.data;
  },

  markOrderRented: async (orderId) => {
    const response = await api.post(`/api/admin/orders/${orderId}/mark-rented`);
    return response.data;
  },

  returnOrder: async (orderId) => {
    const response = await api.post(`/api/admin/orders/${orderId}/return`);
    return response.data;
  },

  completeOrder: async (orderId) => {
    const response = await api.post(`/api/admin/orders/${orderId}/complete`);
    return response.data;
  }
};
