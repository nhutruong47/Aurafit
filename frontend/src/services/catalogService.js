import { requestJson } from './http/request';

export const fetchPublicCategories = async () =>
  requestJson({
    url: '/categories',
    method: 'GET',
  });

export const fetchPublicCostumes = async ({ categoryId, keyword, pageNo = 0, pageSize = 12, sortBy, sortDir } = {}) =>
  requestJson({
    url: '/costumes',
    method: 'GET',
    params: {
      ...(categoryId ? { category: categoryId } : {}),
      ...(keyword ? { keyword } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortDir ? { sortDir } : {}),
      pageNo,
      pageSize,
    },
  });

export const fetchPublicCostumeDetail = async (id) =>
  requestJson({
    url: `/costumes/${encodeURIComponent(id)}`,
    method: 'GET',
  });
