import { requestJson } from './http/request';

const INTERACTION_SESSION_KEY = 'aurafitInteractionSessionId';

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
    'Khong the ghi nhan hanh vi nguoi dung.'
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
    'Khong the lien ket lich su guest voi tai khoan hien tai.'
  );

export const logUserInteraction = async (interactionData) => {
  try {
    return await trackUserBehavior(interactionData);
  } catch {
    return null;
  }
};
