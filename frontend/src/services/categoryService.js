import { requestJson } from './http/request';

export const createCategory = async (payload) =>
  requestJson(
    { url: '/categories', method: 'POST', data: payload },
    'Không thể tạo danh mục.'
  );

export const updateCategory = async (id, payload) =>
  requestJson(
    { url: `/categories/${id}`, method: 'PUT', data: payload },
    'Không thể cập nhật danh mục.'
  );

export const deleteCategory = async (id) =>
  requestJson(
    { url: `/categories/${id}`, method: 'DELETE' },
    'Hệ thống gặp sự cố khi xóa danh mục.'
  );

export const fetchAdminCategories = async (options = {}) => {
  const { pageNo = 0, pageSize = 12, sortBy = 'id', sortDir = 'desc', keyword, parentId } = options;

  const payload = await requestJson(
    {
      url: '/categories/search',
      method: 'GET',
      params: {
        pageNo,
        pageSize,
        sortBy,
        sortDir,
        ...(keyword ? { keyword } : {}),
        ...(parentId ? { parentId } : {}),
      },
    },
    'Hệ thống không thể truy xuất danh sách danh mục.'
  );

  if (payload && typeof payload === 'object' && Array.isArray(payload.content)) {
    return {
      data: payload.content,
      totalPages: payload.totalPages || 1,
      totalElements: payload.totalElements || 0,
      currentPage: payload.pageNo ?? payload.number ?? pageNo,
    };
  }

  const normalizeListResponse = (p) => {
    if (Array.isArray(p)) return p;
    if (Array.isArray(p?.content)) return p.content;
    return [];
  };

  return {
    data: normalizeListResponse(payload),
    totalPages: 1,
    totalElements: normalizeListResponse(payload).length,
    currentPage: 0,
  };
};

export const fetchCategoryTree = async () =>
  requestJson(
    { url: '/categories/tree', method: 'GET' },
    'Hệ thống không thể tải cây danh mục.'
  );
