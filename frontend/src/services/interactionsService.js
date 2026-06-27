import { requestJson } from './http/request';

const INTERACTION_SESSION_KEY = 'aurafitInteractionSessionId';
const AI_STYLIST_PENDING_ATTRIBUTION_KEY = 'aurafitAiStylistPendingAttribution';
const AI_STYLIST_CART_ATTRIBUTION_KEY = 'aurafitAiStylistCartAttribution';
const AI_STYLIST_SOURCE = 'AI_STYLIST';
const AI_STYLIST_SLOT = 'ai_stylist_chat';
const ATTRIBUTION_TTL_MS = 1000 * 60 * 60 * 6;

const createSessionId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getInteractionSessionId = () => {
  if (typeof window === 'undefined') {
    return createSessionId();
  }

  const existing =
    window.sessionStorage.getItem(INTERACTION_SESSION_KEY) ||
    window.localStorage.getItem(INTERACTION_SESSION_KEY) ||
    '';
  if (existing) {
    return existing;
  }

  const nextSessionId = createSessionId();
  window.sessionStorage.setItem(INTERACTION_SESSION_KEY, nextSessionId);
  window.localStorage.setItem(INTERACTION_SESSION_KEY, nextSessionId);
  return nextSessionId;
};

const readBrowserMap = (storageKey) => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeBrowserMap = (storageKey, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

const isFreshAttribution = (value) =>
  value?.recordedAt && Date.now() - Number(value.recordedAt) <= ATTRIBUTION_TTL_MS;

const cleanupAttributionMap = (valueMap = {}) =>
  Object.fromEntries(Object.entries(valueMap).filter(([, value]) => isFreshAttribution(value)));

const buildPendingAttributionKey = (costumeId) => {
  if (costumeId === undefined || costumeId === null) {
    return null;
  }

  return String(costumeId);
};

const buildCartAttributionKey = (item = {}) => {
  const costumeItemId = item.costumeItemId ?? item.id ?? item.targetId ?? null;
  const costumeId = item.costumeId ?? item.costume?.id ?? null;
  const sku = item.sku || '';
  const rentalStartDate = item.rentalStartDate || '';
  const rentalEndDate = item.rentalEndDate || '';

  if (!costumeItemId && !costumeId && !sku) {
    return null;
  }

  return [costumeItemId || '', costumeId || '', sku, rentalStartDate, rentalEndDate].join('|');
};

const buildAiStylistMetadata = (metadata = {}) => ({
  source: AI_STYLIST_SOURCE,
  slot: AI_STYLIST_SLOT,
  ...metadata,
});

const normalizeMetadataJson = (metadata, metadataJson) => {
  if (typeof metadataJson === 'string' && metadataJson.trim()) {
    return metadataJson.trim();
  }

  if (typeof metadata === 'string' && metadata.trim()) {
    return metadata.trim();
  }

  if (metadata && typeof metadata === 'object') {
    return JSON.stringify(metadata);
  }

  return null;
};

const normalizeInteractionPayload = (interactionData = {}) => ({
  sessionId: interactionData.sessionId || getInteractionSessionId(),
  eventType: interactionData.eventType || interactionData.actionType,
  targetType: interactionData.targetType || null,
  targetId:
    interactionData.targetId !== undefined && interactionData.targetId !== null
      ? String(interactionData.targetId)
      : null,
  queryText: interactionData.queryText || interactionData.query || null,
  pagePath: interactionData.pagePath || (typeof window !== 'undefined' ? window.location.pathname : null),
  metadataJson: normalizeMetadataJson(interactionData.metadata, interactionData.metadataJson),
});

export const trackUserBehavior = async (interactionData) =>
  requestJson(
    {
      url: '/interactions',
      method: 'POST',
      data: normalizeInteractionPayload(interactionData),
    },
    'Không thể ghi nhận hành vi người dùng.'
  );

export const attachGuestSessionToCurrentUser = async () =>
  requestJson(
    {
      url: '/interactions/sessions/attach',
      method: 'POST',
      data: {
        sessionId: getInteractionSessionId(),
      },
    },
    'Không thể liên kết lịch sử guest với tài khoản hiện tại.'
  );

export const logUserInteraction = async (interactionData) => {
  try {
    return await trackUserBehavior(interactionData);
  } catch {
    return null;
  }
};

export const trackAiStylistSessionStart = async ({
  interactionSessionId,
  aiStylistSessionId,
  guestSessionId,
  lifecycle,
  contextCostumeId,
  userType,
}) =>
  logUserInteraction({
    sessionId: interactionSessionId,
    eventType: 'AI_CHAT_SESSION_START',
    targetType: 'CHAT',
    targetId: aiStylistSessionId,
    metadata: buildAiStylistMetadata({
      aiStylistSessionId,
      guestSessionId,
      lifecycle,
      contextCostumeId,
      userType,
    }),
  });

export const trackAiStylistUserMessage = async ({
  interactionSessionId,
  aiStylistSessionId,
  guestSessionId,
  queryText,
  selectedCostumeId,
  rentalStartDate,
  rentalEndDate,
}) =>
  logUserInteraction({
    sessionId: interactionSessionId,
    eventType: 'CHAT_QUERY',
    targetType: 'CHAT',
    targetId: aiStylistSessionId,
    queryText,
    metadata: buildAiStylistMetadata({
      aiStylistSessionId,
      guestSessionId,
      selectedCostumeId,
      rentalStartDate,
      rentalEndDate,
    }),
  });

export const trackAiStylistAssistantMessage = async ({
  interactionSessionId,
  aiStylistSessionId,
  guestSessionId,
  assistantMessageId,
  recommendationIds,
  rentalStartDate,
  rentalEndDate,
  variant,
}) =>
  logUserInteraction({
    sessionId: interactionSessionId,
    eventType: 'AI_CHAT_ASSISTANT_MESSAGE',
    targetType: 'CHAT',
    targetId: aiStylistSessionId,
    metadata: buildAiStylistMetadata({
      aiStylistSessionId,
      guestSessionId,
      aiStylistMessageId: assistantMessageId,
      recommendationCount: Array.isArray(recommendationIds) ? recommendationIds.length : 0,
      recommendedCostumeIds: recommendationIds || [],
      rentalStartDate,
      rentalEndDate,
      variant,
    }),
  });

export const trackAiStylistRecommendationImpression = async ({
  interactionSessionId,
  aiStylistSessionId,
  guestSessionId,
  assistantMessageId,
  recommendationIds,
  rentalStartDate,
  rentalEndDate,
}) =>
  logUserInteraction({
    sessionId: interactionSessionId,
    eventType: 'RECOMMENDATION_IMPRESSION',
    targetType: 'RECOMMENDATION',
    metadata: buildAiStylistMetadata({
      aiStylistSessionId,
      guestSessionId,
      aiStylistMessageId: assistantMessageId,
      recommendedCostumeIds: recommendationIds || [],
      rentalStartDate,
      rentalEndDate,
    }),
  });

export const trackAiStylistRecommendationClick = async ({
  interactionSessionId,
  aiStylistSessionId,
  guestSessionId,
  assistantMessageId,
  costumeId,
  position,
  reason,
  rentalStartDate,
  rentalEndDate,
}) =>
  logUserInteraction({
    sessionId: interactionSessionId,
    eventType: 'RECOMMENDATION_CLICK',
    targetType: 'RECOMMENDATION',
    targetId: costumeId,
    metadata: buildAiStylistMetadata({
      aiStylistSessionId,
      guestSessionId,
      aiStylistMessageId: assistantMessageId,
      recommendedCostumeId: costumeId,
      position,
      reason,
      rentalStartDate,
      rentalEndDate,
    }),
  });

export const rememberAiStylistRecommendationAttribution = (attribution = {}) => {
  const storageKey = buildPendingAttributionKey(attribution.costumeId);
  if (!storageKey) {
    return null;
  }

  const attributionMap = cleanupAttributionMap(readBrowserMap(AI_STYLIST_PENDING_ATTRIBUTION_KEY));
  attributionMap[storageKey] = {
    ...buildAiStylistMetadata(attribution),
    recordedAt: Date.now(),
  };
  writeBrowserMap(AI_STYLIST_PENDING_ATTRIBUTION_KEY, attributionMap);
  return attributionMap[storageKey];
};

export const consumeAiStylistRecommendationAttribution = (costumeId) => {
  const storageKey = buildPendingAttributionKey(costumeId);
  if (!storageKey) {
    return null;
  }

  const attributionMap = cleanupAttributionMap(readBrowserMap(AI_STYLIST_PENDING_ATTRIBUTION_KEY));
  const attribution = attributionMap[storageKey] || null;
  delete attributionMap[storageKey];
  writeBrowserMap(AI_STYLIST_PENDING_ATTRIBUTION_KEY, attributionMap);
  return attribution && isFreshAttribution(attribution) ? attribution : null;
};

export const rememberAiStylistCartAttribution = (item, attribution) => {
  if (!item || !attribution) {
    return;
  }

  const cartKey = buildCartAttributionKey(item);
  if (!cartKey) {
    return;
  }

  const attributionMap = cleanupAttributionMap(readBrowserMap(AI_STYLIST_CART_ATTRIBUTION_KEY));
  attributionMap[cartKey] = {
    ...attribution,
    recordedAt: Date.now(),
  };
  writeBrowserMap(AI_STYLIST_CART_ATTRIBUTION_KEY, attributionMap);
};

export const mergeAiStylistCartAttribution = (items = []) => {
  const attributionMap = cleanupAttributionMap(readBrowserMap(AI_STYLIST_CART_ATTRIBUTION_KEY));
  writeBrowserMap(AI_STYLIST_CART_ATTRIBUTION_KEY, attributionMap);

  return (items || []).map((item) => {
    const attributionKey = buildCartAttributionKey(item);
    const attribution = attributionKey ? attributionMap[attributionKey] || null : null;
    return attribution ? { ...item, attribution } : item;
  });
};

export const clearAiStylistCartAttribution = (item) => {
  if (!item) {
    return;
  }

  const cartKey = buildCartAttributionKey(item);
  const attributionMap = cleanupAttributionMap(readBrowserMap(AI_STYLIST_CART_ATTRIBUTION_KEY));
  delete attributionMap[cartKey];
  writeBrowserMap(AI_STYLIST_CART_ATTRIBUTION_KEY, attributionMap);
};
