import { apiClient } from './http/apiClient';
import { getErrorMessage } from './http/request';

const unwrapApiResponse = (payload) => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data;
  }

  return payload;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải ảnh lên backend.'), { cause: error });
  }
};
