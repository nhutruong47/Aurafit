const API_BASE_URL = 'http://localhost:8080/api';

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || 'Không thể kết nối backend/database.');
  }

  return response.json();
};

export const fetchCostumes = async (category) => {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await fetch(`${API_BASE_URL}/costumes${query}`);
  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu sản phẩm từ database.');
  }
  return response.json();
};

export const fetchSeasonalCostumes = async () => requestJson('/costumes/seasonal');

export const fetchRecommendedCostumes = async (userId) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson(`/costumes/recommendations${query}`);
};

export const createCostume = async (costumeData) =>
  requestJson('/costumes', {
    method: 'POST',
    body: JSON.stringify(costumeData),
  });

export const updateCostume = async (id, costumeData) =>
  requestJson(`/costumes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(costumeData),
  });

export const fetchOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  return response.json();
};

export const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return response.json();
};

export const registerUser = async (userData) =>
  requestJson('/users/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const loginUser = async (credentials) =>
  requestJson('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const fetchStaffOrders = async () => requestJson('/orders/staff');

export const fetchStaffOrder = async (orderId) => requestJson(`/orders/staff/${encodeURIComponent(orderId)}`);

export const createPickupHandover = async (orderId, handoverData) =>
  requestJson(`/orders/${encodeURIComponent(orderId)}/handover/pickup`, {
    method: 'POST',
    body: JSON.stringify(handoverData),
  });

export const createReturnHandover = async (orderId, handoverData) =>
  requestJson(`/orders/${encodeURIComponent(orderId)}/handover/return`, {
    method: 'POST',
    body: JSON.stringify(handoverData),
  });

export const createPayment = async (paymentData) =>
  requestJson('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });

export const logUserInteraction = async (interactionData) =>
  requestJson('/interactions', {
    method: 'POST',
    body: JSON.stringify(interactionData),
  });

export default {
  fetchCostumes,
  fetchSeasonalCostumes,
  fetchRecommendedCostumes,
  createCostume,
  updateCostume,
  fetchOrders,
  createOrder,
  registerUser,
  loginUser,
  fetchStaffOrders,
  fetchStaffOrder,
  createPickupHandover,
  createReturnHandover,
  createPayment,
  logUserInteraction,
};
