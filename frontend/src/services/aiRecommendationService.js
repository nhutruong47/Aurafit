import { requestJson } from './http/request';
import { mapCostumeToProduct } from '../utils/productMapper';

const normalizeRecommendationResponse = (payload) => {
  const items = Array.isArray(payload?.items)
    ? payload.items.map((item) => ({
        ...item,
        product: item?.costume ? mapCostumeToProduct(item.costume) : null,
      }))
    : [];

  return {
    queryText: payload?.queryText || '',
    profileSummary: payload?.profileSummary || '',
    fallbackUsed: Boolean(payload?.fallbackUsed),
    items: items.filter((item) => item.product),
  };
};

export const fetchRecommendationQuery = async (payload) =>
  normalizeRecommendationResponse(
    await requestJson({
      url: '/ai/recommendations/query',
      method: 'POST',
      data: payload,
    })
  );

export const fetchPersonalizedRecommendations = async (limit = 6) =>
  normalizeRecommendationResponse(
    await requestJson({
      url: '/ai/recommendations/me',
      method: 'GET',
      params: { limit },
    })
  );

export const fetchOutfitCombos = async (payload) => {
  const response = await requestJson({
    url: '/ai/recommendations/outfit-combos',
    method: 'POST',
    data: payload,
  });

  return {
    anchorLabel: response?.anchorLabel || '',
    fallbackUsed: Boolean(response?.fallbackUsed),
    items: Array.isArray(response?.items)
      ? response.items
          .map((item) => ({
            ...item,
            product: item?.costume ? mapCostumeToProduct(item.costume) : null,
          }))
          .filter((item) => item.product)
      : [],
  };
};

export const fetchAdminProductAiMetadata = async (costumeId) =>
  requestJson({
    url: `/admin/costumes/${encodeURIComponent(costumeId)}/ai-metadata`,
    method: 'GET',
  });

export const updateAdminProductAiMetadata = async (costumeId, payload) =>
  requestJson({
    url: `/admin/costumes/${encodeURIComponent(costumeId)}/ai-metadata`,
    method: 'PUT',
    data: payload,
  });

export const fetchFashionTrends = async () =>
  requestJson({
    url: '/admin/fashion-trends',
    method: 'GET',
  });

export const createFashionTrend = async (payload) =>
  requestJson({
    url: '/admin/fashion-trends',
    method: 'POST',
    data: payload,
  });

export const updateFashionTrend = async (trendId, payload) =>
  requestJson({
    url: `/admin/fashion-trends/${encodeURIComponent(trendId)}`,
    method: 'PUT',
    data: payload,
  });
