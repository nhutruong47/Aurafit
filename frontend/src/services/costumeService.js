import { apiClient } from './http/apiClient';
import { getErrorMessage, requestJson } from './http/request';

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
};

export const fetchCostumes = async (options = {}) => {
  const requestOptions =
    typeof options === 'object' && options !== null ? options : options ? { category: options } : {};
  const {
    category,
    keyword,
    pageNo = 0,
    pageSize = 100,
    sortBy = 'id',
    sortDir = 'desc',
  } = requestOptions;

  try {
    const response = await apiClient.get('/costumes', {
      params: {
        ...(category ? { category } : {}),
        ...(keyword ? { keyword } : {}),
        pageNo,
        pageSize,
        sortBy,
        sortDir,
      },
    });
    return normalizeListResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Khong the tai du lieu san pham tu database.'));
  }
};

export const fetchCostumeById = async (id) =>
  requestJson({
    url: `/costumes/${encodeURIComponent(id)}`,
    method: 'GET',
  });

export const fetchSeasonalCostumes = async () =>
  requestJson({ url: '/costumes/seasonal', method: 'GET' });

export const fetchRecommendedCostumes = async (userId) =>
  requestJson({
    url: '/costumes/recommendations',
    method: 'GET',
    params: userId ? { userId } : undefined,
  });

export const fetchAdminCostumes = async () =>
  requestJson({
    url: '/admin/costumes',
    method: 'GET',
  });

export const createCostume = async (costumeData) =>
  requestJson({
    url: '/admin/costumes',
    method: 'POST',
    data: costumeData,
  });

export const updateCostume = async (id, costumeData) =>
  requestJson({
    url: `/admin/costumes/${encodeURIComponent(id)}`,
    method: 'PUT',
    data: costumeData,
  });
