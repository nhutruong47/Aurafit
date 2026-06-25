import { loadString, saveString } from '../store/browserStorage';
import { requestJson } from './http/request';

const SESSION_STORAGE_KEY = 'aurafitAiSessionId';

const createSessionId = () => `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const getAiSessionId = () => {
  const existing = loadString(SESSION_STORAGE_KEY, null);
  if (existing) {
    return existing;
  }

  const nextValue = createSessionId();
  saveString(SESSION_STORAGE_KEY, nextValue);
  return nextValue;
};

export const trackUserBehavior = async (interactionData) =>
  requestJson({
    url: '/ai/track',
    method: 'POST',
    data: {
      sessionId: getAiSessionId(),
      ...interactionData,
    },
  });

export const logUserInteraction = async (interactionData) => {
  try {
    return await trackUserBehavior(interactionData);
  } catch {
    return null;
  }
};

export const trackProductView = async ({ productId, sourcePage, sourceModule }) =>
  logUserInteraction({
    eventType: 'VIEW_PRODUCT',
    costumeId: productId,
    sourcePage,
    sourceModule,
  });

export const trackCatalogSearch = async ({ query, selectedFilter, sourcePage }) =>
  logUserInteraction({
    eventType: 'SEARCH',
    queryText: query,
    sourcePage,
    sourceModule: 'catalog-search',
    filterPayload: selectedFilter,
  });

export const trackCatalogFilter = async ({ selectedFilter, sourcePage }) =>
  logUserInteraction({
    eventType: 'APPLY_FILTER',
    sourcePage,
    sourceModule: 'catalog-filter',
    filterPayload: selectedFilter,
    styleTags: selectedFilter?.tag ? [selectedFilter.tag] : [],
  });

export const trackRecommendationClick = async ({ productId, sourcePage, sourceModule, reason }) =>
  logUserInteraction({
    eventType: 'CLICK_RECOMMENDATION',
    costumeId: productId,
    sourcePage,
    sourceModule,
    metadata: { reason },
  });
