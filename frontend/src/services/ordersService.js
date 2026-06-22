import { requestJson } from './http/request';

export const fetchOrders = async () => requestJson({ url: '/orders', method: 'GET' });

export const createOrder = async (orderData) =>
  requestJson({
    url: '/orders/checkout',
    method: 'POST',
    data: orderData,
  });

export const fetchOrderDetail = async (orderId) =>
  requestJson({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'GET' });

export const fetchOrderTimeline = async (orderId) =>
  requestJson({ url: `/orders/${encodeURIComponent(orderId)}/timeline`, method: 'GET' });

export const fetchStaffOrders = async () => requestJson({ url: '/orders/staff', method: 'GET' });

export const fetchStaffOrder = async (orderId) =>
  requestJson({ url: `/orders/staff/${encodeURIComponent(orderId)}`, method: 'GET' });

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
