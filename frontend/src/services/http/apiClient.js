import axios from 'axios';
import { env } from '../../config/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
