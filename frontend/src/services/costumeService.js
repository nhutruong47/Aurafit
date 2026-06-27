import { requestJson } from './http/request';

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
    typeof options === 'object' && options !== null ? options : options ? { categoryId: options } : {};
  const {
    signal,
    categoryId,
    keyword,
    pageNo = 0,
    pageSize = 100,
    sortBy = 'id',
    sortDir = 'desc',
  } = requestOptions;

  const payload = await requestJson(
    {
      url: '/costumes',
      method: 'GET',
      params: {
        ...(categoryId ? { categoryId } : {}),
        ...(keyword ? { keyword } : {}),
        pageNo,
        pageSize,
        sortBy,
        sortDir,
      },
      signal,
    },
    'Không thể tải dữ liệu sản phẩm từ database.'
  );

  return normalizeListResponse(payload);
};

export const fetchCostumeById = async (id) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(id)}`,
      method: 'GET',
    },
    'Không thể tải chi tiết sản phẩm.'
  );

export const fetchCostumeItems = async (costumeId) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(costumeId)}/items`,
      method: 'GET',
    },
    'Không thể tải danh sách kích thước / màu sắc.'
  );

export const fetchSeasonalCostumes = async () =>
  requestJson(
    {
      url: '/costumes/seasonal',
      method: 'GET',
    },
    'Không thể tải danh sách sản phẩm theo mùa.'
  );

export const fetchRecommendedCostumes = async (userId) =>
  requestJson(
    {
      url: '/costumes/recommendations',
      method: 'GET',
      params: userId ? { userId } : undefined,
    },
    'Không thể tải danh sách gợi ý sản phẩm.'
  );

export const fetchSimilarCostumes = async (costumeId, limit = 4) =>
  requestJson(
    {
      url: `/recommendations/similar/${encodeURIComponent(costumeId)}`,
      method: 'GET',
      params: {
        limit,
      },
    },
    'Không thể tải danh sách sản phẩm tương tự.'
  );

export const fetchHomepageRecommendations = async (sessionId, limit = 6) =>
  requestJson(
    {
      url: '/recommendations/home',
      method: 'GET',
      params: {
        ...(sessionId ? { sessionId } : {}),
        limit,
      },
    },
    'Không thể tải gợi ý cá nhân hóa cho trang chủ.'
  );

export const fetchAdminCostumes = async () => {
  const payload = await requestJson(
    {
      url: '/costumes/admin',
      method: 'GET',
    },
    'Không thể tải danh sách sản phẩm.'
  );

  return normalizeListResponse(payload);
};

export const createCostume = async (costumeData) =>
  requestJson(
    {
      url: '/costumes',
      method: 'POST',
      data: costumeData,
    },
    'Không thể tạo sản phẩm.'
  );

export const updateCostume = async (id, costumeData) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(id)}`,
      method: 'PUT',
      data: costumeData,
    },
    'Không thể cập nhật sản phẩm.'
  );
