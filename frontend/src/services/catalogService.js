import { requestJson } from './http/request';

export const fetchPublicCategories = async () =>
  requestJson(
    {
      url: '/categories',
      method: 'GET',
    },
    'Không thể tải danh mục.'
  );

export const fetchPublicCostumes = async ({
  categoryId,
  keyword,
  pageNo = 0,
  pageSize = 12,
  sortBy,
  sortDir,
} = {}) =>
  requestJson(
    {
      url: '/costumes',
      method: 'GET',
      params: {
        ...(categoryId ? { categoryId } : {}),
        ...(keyword ? { keyword } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortDir ? { sortDir } : {}),
        pageNo,
        pageSize,
      },
    },
    'Không thể tải danh sách sản phẩm.'
  );

export const fetchPublicCostumeDetail = async (id) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(id)}`,
      method: 'GET',
    },
    'Không thể tải chi tiết sản phẩm.'
  );
