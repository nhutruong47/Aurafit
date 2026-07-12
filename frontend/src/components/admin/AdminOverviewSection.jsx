// Khu vuc tong quan chi so va nguyen tac van hanh trong admin dashboard.
import { useEffect, useState } from 'react';
import { MetricCard, Panel, RuleCard } from './AdminDashboardShared';
import { fetchMetrics } from '../../services/analyticsService';

export default function AdminOverviewSection({ metricCards: defaultMetricCards }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(() => {});
  }, []);

  const displayCards = metrics
    ? [
        { label: 'Tổng Đơn', value: metrics.totalOrders || '0', delta: 'Cập nhật từ DB' },
        { label: 'Doanh Thu', value: metrics.totalRevenue || '0', delta: 'Cập nhật từ DB' },
        { label: 'Tài khoản', value: metrics.totalUsers || '0', delta: 'Cập nhật từ DB' },
        { label: 'Sản phẩm', value: metrics.totalCostumes || '0', delta: 'Cập nhật từ DB' },
      ]
    : defaultMetricCards;

  return (
    <section>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {displayCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <Panel title="Luồng quyền hiện tại">
          <div className="grid gap-4 md:grid-cols-2">
            <RuleCard icon="admin_panel_settings" title="Admin" text="Quản lý hệ thống và sản phẩm." />
            <RuleCard icon="smart_toy" title="Chatbot" text="Khách hàng được tư vấn tự động qua Chatbot AuraFit." />
        </div>
      </Panel>
    </section>
  );
}
