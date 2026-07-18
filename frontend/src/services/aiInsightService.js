import { requestJson } from './http/request';

export const fetchAiInsights = async () =>
  requestJson(
    {
      url: '/admin/analytics/ai-insights',
      method: 'GET',
    },
    'Không thể tải danh sách phân tích AI.'
  );

export const triggerAiInsightGeneration = async () =>
  requestJson(
    {
      url: '/admin/analytics/ai-insights/generate',
      method: 'POST',
    },
    'Không thể tạo phân tích AI mới.'
  );
