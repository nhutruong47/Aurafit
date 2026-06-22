import { requestJson } from './http/request';

export const fetchPublicCategories = async () =>
  requestJson({
    url: '/public/catalog/categories',
    method: 'GET',
  });

export const fetchPublicCostumes = async ({ categoryId, keyword, pageNo = 0, pageSize = 12, sortBy, sortDir } = {}) =>
  requestJson({
    url: '/public/catalog/costumes',
    method: 'GET',
    params: {
      ...(categoryId ? { categoryId } : {}),
      ...(keyword ? { keyword } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortDir ? { sortDir } : {}),
      pageNo,
      pageSize,
    },
  });

export const fetchPublicCostumeDetail = async (id) =>
  requestJson({
    url: `/public/catalog/costumes/${encodeURIComponent(id)}`,
    method: 'GET',
  });
