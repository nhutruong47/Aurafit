import { requestJson } from './http/request';

export const createPayment = async ({ orderId, rentalOrderId, method = 'BANKING', paymentType = 'RENTAL_FEE' } = {}) =>
  requestJson({
    url: '/payment/create',
    method: 'POST',
    data: {
      orderId: orderId ?? rentalOrderId,
      method,
      paymentType,
    },
  });
