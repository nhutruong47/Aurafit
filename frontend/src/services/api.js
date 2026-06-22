const API_BASE_URL = 'http://localhost:8080/api';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = JSON.parse(localStorage.getItem('aurafitCurrentUser') || 'null');
    return userData?.accessToken || null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || 'Không thể kết nối backend/database.');
  }

  return response.json();
};

const unwrapApiResponse = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return payload.data;
  }
  return payload;
};

// ── Public catalog ─────────────────────────────────────────────────────────

export const fetchCostumes = async (category) => {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await fetch(`${API_BASE_URL}/costumes${query}`);
  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu sản phẩm từ database.');
  }
  return response.json();
};

export const fetchPublicCategories = async () => requestJson('/public/catalog/categories');

export const fetchPublicCostumes = async ({ categoryId, keyword, pageNo = 0, pageSize = 12 } = {}) => {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (keyword) params.set('keyword', keyword);
  params.set('pageNo', pageNo);
  params.set('pageSize', pageSize);
  return requestJson(`/public/catalog/costumes?${params.toString()}`);
};

export const fetchPublicCostumeDetail = async (id) => requestJson(`/public/catalog/costumes/${encodeURIComponent(id)}`);

export const fetchCostumeById = async (id) => requestJson(`/costumes/${encodeURIComponent(id)}`);

export const fetchSeasonalCostumes = async () => requestJson('/costumes/seasonal');

export const fetchRecommendedCostumes = async (userId) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson(`/costumes/recommendations${query}`);
};

// ── Admin costume management ───────────────────────────────────────────────

export const createCostume = async (costumeData) =>
  requestJson('/admin/costumes', {
    method: 'POST',
    body: JSON.stringify(costumeData),
  });

export const updateCostume = async (id, costumeData) =>
  requestJson(`/admin/costumes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(costumeData),
  });

// ── Auth (registration with OTP) ──────────────────────────────────────────

export const requestRegistrationOtp = async ({ email, fullName, phone, password }) => {
  const payload = unwrapApiResponse(
    await requestJson('/auth/register/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, phone, password }),
    })
  );
  return payload;
};

export const verifyOtpAndRegister = async ({ email, otpCode }) => {
  const payload = unwrapApiResponse(
    await requestJson('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    })
  );
  return payload;
};

// ── Auth (login / refresh) ────────────────────────────────────────────────

export const registerUser = async (userData) =>
  unwrapApiResponse(
    await requestJson('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  );

export const loginUser = async (credentials) =>
  unwrapApiResponse(
    await requestJson('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  );

export const refreshAccessToken = async () =>
  unwrapApiResponse(
    await requestJson('/users/refresh', {
      method: 'POST',
    })
  );

// ── Cart (authenticated) ──────────────────────────────────────────────────

export const fetchCart = async () => requestJson('/cart');

export const addItemToCart = async ({ costumeItemId, rentalStartDate, rentalEndDate }) =>
  requestJson('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ costumeItemId, rentalStartDate, rentalEndDate }),
  });

export const removeCartItem = async (cartItemId) =>
  requestJson(`/cart/remove/${encodeURIComponent(cartItemId)}`, {
    method: 'DELETE',
  });

// ── Orders (checkout + tracking) ──────────────────────────────────────────

export const createOrder = async (orderData) =>
  requestJson('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });

export const fetchOrders = async () => requestJson('/orders');

export const fetchOrderDetail = async (orderId) =>
  requestJson(`/orders/${encodeURIComponent(orderId)}`);

export const fetchOrderTimeline = async (orderId) =>
  requestJson(`/orders/${encodeURIComponent(orderId)}/timeline`);

// ── Payment (VietQR / SePay) ──────────────────────────────────────────────

export const createPayment = async ({ orderId, method = 'BANKING', paymentType = 'RENTAL_FEE' } = {}) =>
  requestJson('/payment/create', {
    method: 'POST',
    body: JSON.stringify({ orderId, method, paymentType }),
  });

// ── Staff ────────────────────────────────────────────────────────────────

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

// ── AI Engine ────────────────────────────────────────────────────────────

export const trackUserBehavior = async (payload) =>
  requestJson('/ai/track', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchAiRecommendations = async ({ sessionId, userId } = {}) => {
  const params = new URLSearchParams();
  if (sessionId) params.set('sessionId', sessionId);
  if (userId) params.set('userId', userId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return requestJson(`/ai/recommendations${query}`);
};

export const fetchSimilarCostumes = async (costumeId) =>
  requestJson(`/ai/recommendations/similar/${encodeURIComponent(costumeId)}`);

export const fetchComplementaryCostumes = async () =>
  requestJson('/ai/recommendations/complementary');

// ── AI Chat ──────────────────────────────────────────────────────────────

export const createChatSession = async (payload = {}) =>
  requestJson('/ai/chat/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const sendChatMessage = async ({ sessionId, message }) =>
  requestJson('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
  });

export const fetchChatHistory = async (sessionId) =>
  requestJson(`/ai/chat/sessions/${encodeURIComponent(sessionId)}/messages`);

export const closeChatSession = async (sessionId) =>
  requestJson(`/ai/chat/sessions/${encodeURIComponent(sessionId)}/close`, {
    method: 'PUT',
  });

// ── User profile (account management) ────────────────────────────────────

export const fetchUserProfile = async () => requestJson('/users/profile');

export const updateUserProfile = async (profileData) =>
  requestJson('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

export const changePassword = async ({ currentPassword, newPassword }) =>
  requestJson('/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

// ── Interaction tracking (fire-and-forget) ──────────────────────────────
// Kept as alias for backward compatibility with existing call sites.
export const logUserInteraction = async (interactionData) => {
  try {
    return await trackUserBehavior(interactionData);
  } catch (error) {
    // Behavior tracking must never break UX.
    return null;
  }
};

export default {
  // catalog
  fetchCostumes,
  fetchPublicCategories,
  fetchPublicCostumes,
  fetchPublicCostumeDetail,
  fetchCostumeById,
  fetchSeasonalCostumes,
  fetchRecommendedCostumes,
  fetchAiRecommendations,
  fetchSimilarCostumes,
  fetchComplementaryCostumes,
  // admin
  createCostume,
  updateCostume,
  // auth
  requestRegistrationOtp,
  verifyOtpAndRegister,
  registerUser,
  loginUser,
  refreshAccessToken,
  // cart
  fetchCart,
  addItemToCart,
  removeCartItem,
  // orders
  createOrder,
  fetchOrders,
  fetchOrderDetail,
  fetchOrderTimeline,
  // payment
  createPayment,
  // staff
  fetchStaffOrders,
  fetchStaffOrder,
  createPickupHandover,
  createReturnHandover,
  // ai chat
  createChatSession,
  sendChatMessage,
  fetchChatHistory,
  closeChatSession,
  // user
  fetchUserProfile,
  updateUserProfile,
  changePassword,
  // tracking
  logUserInteraction,
  trackUserBehavior,
};
