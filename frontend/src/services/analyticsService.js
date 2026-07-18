import { requestJson } from './http/request';

export const fetchMetrics = async () =>
  requestJson(
    { url: '/analytics/metrics', method: 'GET' },
    'Không thể tải chỉ số tổng quan.'
  );

export const fetchRevenueChart = async (startDate, endDate) =>
  requestJson(
    {
      url: '/analytics/revenue-chart',
      method: 'GET',
      params: { startDate, endDate },
    },
    'Không thể tải dữ liệu biểu đồ doanh thu.'
  );

export const fetchRevenueTransactions = async ({
  page = 0,
  size = 10,
  keyword,
  startDate,
  endDate,
} = {}) =>
  requestJson(
    {
      url: '/analytics/revenue-transactions',
      method: 'GET',
      params: {
        page,
        size,
        ...(keyword ? { keyword } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      },
    },
    'Không thể tải danh sách giao dịch doanh thu.'
  );

export const fetchTopCostumes = async (limit = 5) =>
  requestJson(
    {
      url: '/analytics/top-costumes',
      method: 'GET',
      params: { limit },
    },
    'Không thể tải danh sách sản phẩm nổi bật.'
  );
