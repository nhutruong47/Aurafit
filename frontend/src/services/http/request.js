import { apiClient } from './apiClient';

const unwrapApiResponse = (payload) => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data;
  }

  return payload;
};

export const getErrorMessage = (error, fallbackMessage) => {
  const responseData = error.response?.data;
  const responseMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.details ||
    error.message;

  return responseMessage || fallbackMessage;
};

export const requestJson = async (config, fallbackMessage = 'Không thể kết nối backend/database.') => {
  try {
    const response = await apiClient.request(config);
    return unwrapApiResponse(response.data);
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      throw error;
    }

    throw new Error(getErrorMessage(error, fallbackMessage));
  }
};
