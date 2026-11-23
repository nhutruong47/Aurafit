const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Relative /api is correct for production (Vercel rewrites it to the API host).
// Only the local dev server should call the backend directly.
const defaultApiBaseUrl = import.meta.env.DEV ? 'http://localhost:8080/api' : '/api';

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'AuraFit',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
  apiTimeoutMs: parseNumber(import.meta.env.VITE_API_TIMEOUT_MS, 30000),
};
