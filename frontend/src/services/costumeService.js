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
    categoryPath,
    keyword,
    pageNo = 0,
    pageSize = 20,
    sortBy = 'id',
    sortDir = 'desc',
  } = requestOptions;

  const payload = await requestJson(
    {
      url: '/costumes',
      method: 'GET',
      params: {
        ...(categoryId ? { categoryId } : {}),
        ...(categoryPath ? { categoryPath } : {}),
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

  // Return structured pagination metadata for DB-level paging
  if (payload && typeof payload === 'object' && Array.isArray(payload.content)) {
    return {
      data: payload.content,
      totalPages: payload.totalPages || 1,
      totalElements: payload.totalElements || 0,
      currentPage: payload.pageNo ?? payload.number ?? pageNo,
    };
  }

  // Fallback for non-paginated responses
  return {
    data: normalizeListResponse(payload),
    totalPages: 1,
    totalElements: normalizeListResponse(payload).length,
    currentPage: 0,
  };
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

export const fetchAdminCostumes = async (options = {}) => {
  const {
    pageNo = 0,
    pageSize = 12,
    sortBy = 'id',
    sortDir = 'desc',
    keyword,
    status,
    categoryId,
  } = options;

  const payload = await requestJson(
    {
      url: '/costumes/admin',
      method: 'GET',
      params: {
        pageNo,
        pageSize,
        sortBy,
        sortDir,
        ...(keyword ? { keyword } : {}),
        ...(status ? { status } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
    },
    'Không thể tải danh sách sản phẩm.'
  );

  if (payload && typeof payload === 'object' && Array.isArray(payload.content)) {
    return {
      data: payload.content,
      totalPages: payload.totalPages || 1,
      totalElements: payload.totalElements || 0,
      currentPage: payload.pageNo ?? payload.number ?? pageNo,
    };
  }

  return {
    data: normalizeListResponse(payload),
    totalPages: 1,
    totalElements: normalizeListResponse(payload).length,
    currentPage: 0,
  };
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

// --- CostumeItem Admin API ---

export const fetchAdminCostumeItems = async (costumeId) =>
  requestJson(
    {
      url: `/costumes/admin/${encodeURIComponent(costumeId)}/items`,
      method: 'GET',
    },
    'Không thể tải danh sách phân loại kho.'
  );

export const createCostumeItem = async (costumeId, itemData) =>
  requestJson(
    {
      url: `/costumes/admin/${encodeURIComponent(costumeId)}/items`,
      method: 'POST',
      data: itemData,
    },
    'Không thể tạo phân loại mới.'
  );

export const updateCostumeItem = async (costumeId, itemId, itemData) =>
  requestJson(
    {
      url: `/costumes/admin/${encodeURIComponent(costumeId)}/items/${encodeURIComponent(itemId)}`,
      method: 'PUT',
      data: itemData,
    },
    'Không thể cập nhật phân loại.'
  );

export const deleteCostumeItem = async (costumeId, itemId) =>
  requestJson(
    {
      url: `/costumes/admin/${encodeURIComponent(costumeId)}/items/${encodeURIComponent(itemId)}`,
      method: 'DELETE',
    },
    'Không thể xóa phân loại.'
  );
