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

export const getPaymentStatus = async (orderId) =>
  requestJson(
    { url: `/payments/status?orderId=${encodeURIComponent(orderId)}`, method: 'GET' },
    'Không thể kiểm tra trạng thái thanh toán.'
  );

export const testWebhookPayment = async ({ orderId, paymentContent, amount }) =>
  requestJson(
    {
      url: '/public/payment/test-webhook',
      method: 'POST',
      data: {
        gateway: 'TEST',
        transfer_amount: amount,
        content: paymentContent || `ARF${orderId}`,
        code: `TXN-TEST-${Date.now()}`,
        accountNumber: '1234567890',
      },
    },
    'Không thể test thanh toán.'
  );
