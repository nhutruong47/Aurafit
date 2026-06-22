import { requestJson } from './http/request';

export const createPayment = async ({ orderId, rentalOrderId } = {}) =>
  requestJson({
    url: '/payment/create',
    method: 'POST',
    data: {
      orderId: orderId ?? rentalOrderId,
    },
  });
