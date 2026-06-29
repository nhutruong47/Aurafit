import { requestJson } from './http/request';

export const fetchRecommendationAnalytics = async (days = 30) =>
  requestJson(
    {
      url: '/recommendations/analytics',
      method: 'GET',
      params: { days },
    },
    'Không thể tải báo cáo AI recommendation.'
  );
