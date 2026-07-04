import { requestJson } from './http/request';

export const fetchCategoryTree = async () =>
  requestJson(
    {
      url: '/categories/tree',
      method: 'GET',
    },
    'KhÃ´ng thá»ƒ táº£i cÃ¢y danh má»¥c.'
  );

export const fetchCategoryByPath = async (path) =>
  requestJson(
    {
      url: '/categories/by-path',
      method: 'GET',
      params: {
        path,
      },
    },
    'KhÃ´ng thá»ƒ táº£i danh má»¥c theo Ä‘Æ°á»ng dáº«n.'
  );

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
  categoryPath,
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
        ...(categoryPath ? { categoryPath } : {}),
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
