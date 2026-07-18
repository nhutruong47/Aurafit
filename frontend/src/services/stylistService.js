import { requestJson } from './http/request';

const STYLIST_SESSION_KEY = 'aurafitStylistSessionId';

export const createStylistSessionId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `stylist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getStylistSessionId = () => {
  if (typeof window === 'undefined') {
    return createStylistSessionId();
  }

  const existing = window.localStorage.getItem(STYLIST_SESSION_KEY) || '';
  if (existing) {
    return existing;
  }

  const nextSessionId = createStylistSessionId();
  window.localStorage.setItem(STYLIST_SESSION_KEY, nextSessionId);
  return nextSessionId;
};

export const saveStylistSessionId = (sessionId) => {
  if (typeof window === 'undefined' || !sessionId) {
    return;
  }

  window.localStorage.setItem(STYLIST_SESSION_KEY, sessionId);
};

export const fetchChatSessions = async () => {
  const data = await requestJson(
    {
      url: '/stylist/sessions',
      method: 'GET',
    },
    'Không thể tải lịch sử trò chuyện.'
  );

  return Array.isArray(data) ? data : [];
};

export const fetchSessionDetail = async (sessionId) => {
  const data = await requestJson(
    {
      url: `/stylist/sessions/${encodeURIComponent(sessionId)}`,
      method: 'GET',
    },
    'Không thể tải nội dung cuộc trò chuyện.'
  );

  return {
    sessionId: data?.sessionId || sessionId,
    messages: Array.isArray(data?.messages) ? data.messages : [],
  };
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
