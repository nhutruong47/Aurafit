import { requestJson } from './http/request';

const AI_STYLIST_SESSION_KEY = 'aurafitAiStylistSessionId';

const buildStorageKey = (guestSessionId, userId) =>
  `${AI_STYLIST_SESSION_KEY}:${userId || 'guest'}:${guestSessionId || 'anon'}`;

export const getStoredAiStylistSessionId = (guestSessionId, userId) => {
  if (typeof window === 'undefined') return null;

  return window.sessionStorage.getItem(buildStorageKey(guestSessionId, userId)) || null;
};

export const storeAiStylistSessionId = (sessionId, guestSessionId, userId) => {
  if (typeof window === 'undefined' || !sessionId) return;

  window.sessionStorage.setItem(buildStorageKey(guestSessionId, userId), String(sessionId));
};

export const clearStoredAiStylistSessionId = (guestSessionId, userId) => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.removeItem(buildStorageKey(guestSessionId, userId));
};

export const promoteAiStylistSessionIdToUser = ({ sessionId, guestSessionId, userId }) => {
  if (!userId) return;

  if (sessionId) {
    storeAiStylistSessionId(sessionId, guestSessionId, userId);
  }

  clearStoredAiStylistSessionId(guestSessionId, null);
};

export const createAiStylistSession = async ({ guestSessionId, contextCostumeId }) =>
  requestJson(
    {
      url: '/ai-stylist/sessions',
      method: 'POST',
      data: {
        guestSessionId: guestSessionId || null,
        contextCostumeId: contextCostumeId || null,
      },
    },
    'Không thể tạo phiên AI Stylist.'
  );

export const fetchAiStylistSession = async (sessionId, guestSessionId) =>
  requestJson(
    {
      url: `/ai-stylist/sessions/${encodeURIComponent(sessionId)}`,
      method: 'GET',
      params: guestSessionId ? { guestSessionId } : undefined,
    },
    'Không thể tải phiên AI Stylist.'
  );

export const attachAiStylistSessionToCurrentUser = async ({ guestSessionId, preferredSessionId }) =>
  requestJson(
    {
      url: '/ai-stylist/sessions/attach',
      method: 'POST',
      data: {
        guestSessionId: guestSessionId || null,
        preferredSessionId: preferredSessionId || null,
      },
    },
    'Không thể liên kết lịch sử AI Stylist với tài khoản hiện tại.'
  );

export const sendAiStylistMessage = async ({
  sessionId,
  guestSessionId,
  selectedCostumeId,
  rentalStartDate,
  rentalEndDate,
  message,
}) =>
  requestJson(
    {
      url: '/ai-stylist/messages',
      method: 'POST',
      data: {
        sessionId,
        guestSessionId: guestSessionId || null,
        selectedCostumeId: selectedCostumeId || null,
        rentalStartDate: rentalStartDate || null,
        rentalEndDate: rentalEndDate || null,
        message,
      },
    },
    'Không thể gửi tin nhắn đến AI Stylist.'
  );
