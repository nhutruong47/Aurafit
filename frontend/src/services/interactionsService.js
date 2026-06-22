import { requestJson } from './http/request';

export const logUserInteraction = async (interactionData) =>
  requestJson({
    url: '/interactions',
    method: 'POST',
    data: interactionData,
  });
