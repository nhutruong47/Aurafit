import axios from 'axios';
import { env } from '../../config/env';

const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const user = JSON.parse(window.localStorage.getItem('aurafitCurrentUser') || 'null');
    return user?.accessToken || null;
  } catch {
    return null;
  }
};

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
