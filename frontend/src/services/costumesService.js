import { apiClient } from './http/apiClient';
import { getErrorMessage, requestJson } from './http/request';

export const fetchCostumes = async (category) => {
  try {
    const response = await apiClient.get('/costumes', {
      params: category ? { category } : undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Khong the tai du lieu san pham tu database.'));
  }
};

export const fetchSeasonalCostumes = async () =>
  requestJson({ url: '/costumes/seasonal', method: 'GET' });

export const fetchRecommendedCostumes = async (userId) =>
  requestJson({
    url: '/costumes/recommendations',
    method: 'GET',
    params: userId ? { userId } : undefined,
  });

export const createCostume = async (costumeData) =>
  requestJson({
    url: '/costumes',
    method: 'POST',
    data: costumeData,
  });

export const updateCostume = async (id, costumeData) =>
  requestJson({
    url: `/costumes/${encodeURIComponent(id)}`,
    method: 'PUT',
    data: costumeData,
  });
