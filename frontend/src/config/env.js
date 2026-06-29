const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'AuraFit',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  apiTimeoutMs: parseNumber(import.meta.env.VITE_API_TIMEOUT_MS, 300000),
};
