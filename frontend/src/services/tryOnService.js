import { apiClient } from './http/apiClient';
import { getErrorMessage } from './http/request';

const unwrapApiResponse = (payload) => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

/**
 * POST /api/try-on
 * multipart: personImage, garmentImageUrl, productId, productName
 */
export const generateTryOn = async ({ personImage, garmentImageUrl, productId, productName }) => {
  const formData = new FormData();
  formData.append('personImage', personImage);
  formData.append('garmentImageUrl', garmentImageUrl || '');
  if (productId != null) formData.append('productId', String(productId));
  if (productName) formData.append('productName', productName);

  try {
    const response = await apiClient.post('/try-on', formData, {
      timeout: 180000,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'AI xử lý thất bại. Vui lòng thử lại.'), { cause: error });
  }
};

export const fetchTryOnHistory = async ({ page = 0, size = 10 } = {}) => {
  try {
    const response = await apiClient.get('/try-on/history', { params: { page, size } });
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải lịch sử thử đồ.'), { cause: error });
  }
};

export const deleteTryOnHistory = async (id) => {
  try {
    const response = await apiClient.delete(`/try-on/history/${id}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể xóa lịch sử thử đồ.'), { cause: error });
  }
};
