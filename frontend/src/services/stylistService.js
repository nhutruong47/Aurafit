import { requestJson } from './http/request';

const STYLIST_SESSION_KEY = 'aurafitStylistSessionId';

const createSessionId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `stylist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getStylistSessionId = () => {
  if (typeof window === 'undefined') {
    return createSessionId();
  }

  const existing = window.localStorage.getItem(STYLIST_SESSION_KEY) || '';
  if (existing) {
    return existing;
  }

  const nextSessionId = createSessionId();
  window.localStorage.setItem(STYLIST_SESSION_KEY, nextSessionId);
  return nextSessionId;
};

export const saveStylistSessionId = (sessionId) => {
  if (typeof window === 'undefined' || !sessionId) {
    return;
  }

  window.localStorage.setItem(STYLIST_SESSION_KEY, sessionId);
};

export const sendChatMessage = async (sessionId, message) => {
  const data = await requestJson(
    {
      url: '/stylist/chat',
      method: 'POST',
      data: {
        sessionId: sessionId || getStylistSessionId(),
        message,
      },
    },
    'Không thể kết nối, vui lòng kiểm tra mạng và thử lại'
  );

  const response = {
    sessionId: data?.sessionId || sessionId,
    replyText: data?.replyText || '',
    recommendedCostumes: Array.isArray(data?.recommendedCostumes)
      ? data.recommendedCostumes
      : [],
    hasError: data?.hasError === true,
    errorType: typeof data?.errorType === 'string' ? data.errorType : null,
  };

  saveStylistSessionId(response.sessionId);
  return response;
};
