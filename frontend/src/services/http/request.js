import { apiClient } from './apiClient';

export const getErrorMessage = (error, fallbackMessage) => {
  const responseData = error.response?.data;
  const responseMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.details ||
    error.message;

  return responseMessage || fallbackMessage;
};

export const requestJson = async (config, fallbackMessage = 'Đã xảy ra lỗi hệ thống.') => {
  const { data } = await requestApi(config, fallbackMessage);
  return data;
};

export const requestApi = async (config, fallbackMessage = 'Đã xảy ra lỗi hệ thống.') => {
  try {
    const response = await apiClient.request(config);
    const payload = response.data;

    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
      return {
        data: payload.data,
        message: payload.message || '',
        success: payload.success,
      };
    }

    return {
      data: payload,
      message: '',
      success: true,
    };
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      throw error;
    }

    throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
  }
};
