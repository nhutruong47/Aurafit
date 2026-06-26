import { apiClient } from './http/apiClient';
import { getErrorMessage } from './http/request';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải ảnh lên backend.'));
  }
};
