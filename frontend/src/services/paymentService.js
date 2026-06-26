import { requestJson } from './http/request';

export const createPayment = async ({ orderId, rentalOrderId } = {}) =>
  requestJson(
    {
      url: '/payments',
      method: 'POST',
      data: {
        orderId: Number(orderId ?? rentalOrderId),
      },
    },
    'Không thể khởi tạo thanh toán.'
  );
