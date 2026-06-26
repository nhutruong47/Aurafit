import { apiClient } from './apiClient';

export const getErrorMessage = (error, fallbackMessage) => {
  const responseMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.details ||
    error.message;

  return responseMessage || fallbackMessage;
};

export const requestJson = async (config, fallbackMessage = 'Không thể kết nối backend/database.') => {
  try {
    const response = await apiClient.request(config);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallbackMessage));
  }
};
