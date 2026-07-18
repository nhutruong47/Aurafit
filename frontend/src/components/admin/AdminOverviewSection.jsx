// Khu vuc tong quan chi so va nguyen tac van hanh trong admin dashboard.
import { useEffect, useState } from 'react';
import { MetricCard, Panel, RuleCard } from './AdminDashboardShared';
import { fetchMetrics } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatCurrency';
import AlertMessage from '../ui/AlertMessage';

export default function AdminOverviewSection({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    fetchMetrics()
      .then((data) => {
        if (mounted) setMetrics(data);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError.message || 'Không thể tải chỉ số tổng quan.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const displayCards = [
    {
      label: 'Tổng Đơn',
      value: isLoading ? '—' : String(metrics?.totalOrders ?? 0),
      delta: `${metrics?.pendingOrdersCount ?? 0} đơn đang chờ thanh toán`,
      target: 'orders',
    },
    {
      label: 'Doanh thu',
      value: isLoading ? '—' : formatCurrency(metrics?.totalRevenue ?? 0),
      delta: 'Các giao dịch đã thanh toán',
      target: 'revenue',
    },
    {
      label: 'Tài khoản',
      value: isLoading ? '—' : String(metrics?.totalUsers ?? 0),
      delta: 'Tất cả tài khoản hệ thống',
      target: 'users',
    },
    {
      label: 'Sản phẩm',
      value: isLoading ? '—' : String(metrics?.totalCostumes ?? 0),
      delta: `${metrics?.totalCategories ?? 0} danh mục`,
      target: 'products',
    },
  ];

  return (
    <section>
      {error && <AlertMessage text={error} className="mb-5" />}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {displayCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} onClick={() => onNavigate(metric.target)} />
        ))}
      </div>
      <Panel title="Luồng quyền hiện tại">
          <div>
            <RuleCard icon="admin_panel_settings" title="Admin" text="Quản lý hệ thống, đơn hàng, doanh thu và sản phẩm." />
        </div>
      </Panel>
    </section>
  );
}
