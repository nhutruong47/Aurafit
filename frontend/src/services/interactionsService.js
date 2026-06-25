import { requestJson } from './http/request';

export const trackUserBehavior = async (interactionData) =>
  requestJson({
    url: '/ai/track',
    method: 'POST',
    data: interactionData,
  });

export const logUserInteraction = async (interactionData) => {
  try {
    return await trackUserBehavior(interactionData);
  } catch {
    return null;
  }
};
