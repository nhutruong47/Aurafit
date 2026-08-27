import axios from 'axios';
import { env } from '../../config/env';

// ---------------------------------------------------------------------------
// A dedicated axios instance used ONLY to call the refresh-token endpoint.
// Keeps apiClient.js free of circular imports with authService.js.
// ---------------------------------------------------------------------------
const refreshApi = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const logClientStorageError = (context, error) => {
  if (typeof console !== 'undefined') {
    console.warn('[HandledError]', { context, name: error?.name || 'Error' });
  }
};

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const user = JSON.parse(window.localStorage.getItem('aurafitCurrentUser') || 'null');
    return user?.accessToken || null;
  } catch (error) {
    logClientStorageError('Read access token', error);
    return null;
  }
};

const setTokens = ({ accessToken }) => {
  if (typeof window === 'undefined') return;
  try {
    const user = JSON.parse(window.localStorage.getItem('aurafitCurrentUser') || 'null') || {};
    if (accessToken !== undefined) user.accessToken = accessToken;
    window.localStorage.setItem('aurafitCurrentUser', JSON.stringify(user));
  } catch (error) {
    logClientStorageError('Persist refreshed tokens', error);
  }
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('aurafitCurrentUser');
};

// ---------------------------------------------------------------------------
// Main apiClient
// ---------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
});

// ---- Request interceptor: attach Bearer token ---------------------------

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: auto-refresh on 401 --------------------------

// Serialize in-flight 401 requests so only ONE refresh call is sent
let isRefreshing = false;
const pendingRequests = [];

const resolvePendingRequests = (error, token = null) => {
  pendingRequests.forEach((cb) => cb(error, token));
  pendingRequests.length = 0;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Intercept Network Errors immediately
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      const friendlyMessage = 'Máy chủ hiện đang ngủ gật hoặc bận một chút rồi. Bạn đợi vài phút rồi thử lại nha! 🥺';
      error.message = friendlyMessage;
      if (!error.response) {
        error.response = { data: { message: friendlyMessage }, status: 503 };
      } else if (!error.response.data) {
        error.response.data = { message: friendlyMessage };
      } else {
        error.response.data.message = friendlyMessage;
      }
    }

    const originalRequest = error.config;

    // Skip refresh logic for login endpoint or if we already retried
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // If we are already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((err, newToken) => {
          if (err) return reject(err);
          originalRequest.headers = originalRequest.headers || {};
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(apiClient(originalRequest));
        });
      });
    }

    // Mark as retried so we don't loop
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshApi.post('/auth/refresh');

      const newAccessToken = data?.accessToken || data?.data?.accessToken;

      if (!newAccessToken) {
        throw new Error('No accessToken in refresh response');
      }

      setTokens({ accessToken: newAccessToken });
      resolvePendingRequests(null, newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      resolvePendingRequests(refreshError);
      if (window.location.pathname !== '/account') {
        window.location.href = '/account';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
