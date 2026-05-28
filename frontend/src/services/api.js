const API_BASE_URL = 'http://localhost:8080/api';

export const fetchCostumes = async () => {
  const response = await fetch(`${API_BASE_URL}/costumes`);
  return response.json();
};

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

export default { fetchCostumes, fetchOrders, createOrder };
