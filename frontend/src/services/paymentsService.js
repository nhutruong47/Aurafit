import { requestJson } from './http/request';

export const createPayment = async (paymentData) =>
  requestJson({
    url: '/payments',
    method: 'POST',
    data: paymentData,
  });
