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
// Access token lives in memory only. The refresh token is an HttpOnly cookie,
// so a page reload silently refreshes through /auth/refresh on the first 401.
// ---------------------------------------------------------------------------
let accessToken = null;
let isLoggingOut = false;
let refreshAbortController = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
  isLoggingOut = false;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

/**
 * Stops an in-flight refresh before logout. Without this a refresh that was
 * already running can re-issue the HttpOnly cookie right after logout clears it.
 */
export const beginLogout = () => {
  isLoggingOut = true;
  accessToken = null;
  if (refreshAbortController) {
    refreshAbortController.abort();
    refreshAbortController = null;
  }
};

export const endLogout = () => {
  isLoggingOut = false;
};

const clearTokens = () => {
  accessToken = null;
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

    // Skip refresh logic while logging out, after a retry, or for login itself
    if (
      isLoggingOut ||
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
    refreshAbortController = new AbortController();

    try {
      const { data } = await refreshApi.post('/auth/refresh', null, {
        signal: refreshAbortController.signal,
      });

      const newAccessToken = data?.accessToken || data?.data?.accessToken;

      if (!newAccessToken) {
        throw new Error('No accessToken in refresh response');
      }

      setAccessToken(newAccessToken);
      resolvePendingRequests(null, newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      resolvePendingRequests(refreshError);
      if (!isLoggingOut && window.location.pathname !== '/account') {
        window.location.href = '/account';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
      refreshAbortController = null;
    }
  }
);
