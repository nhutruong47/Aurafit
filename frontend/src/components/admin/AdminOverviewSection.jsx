// Khu vuc tong quan chi so va nguyen tac van hanh trong admin dashboard.
import { MetricCard, Panel, RuleCard } from './AdminDashboardShared';

export default function AdminOverviewSection({ metricCards }) {
  return (
    <section>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <Panel title="Luồng quyền hiện tại">
        <div className="grid gap-4 md:grid-cols-3">
          <RuleCard icon="admin_panel_settings" title="Admin" text="Đăng tải, chỉnh sửa và quản lý sản phẩm." />
          <RuleCard icon="support_agent" title="Liên hệ" text="Khách hàng chỉ liên hệ AuraFit Admin." />
          <RuleCard icon="block" title="Chủ xưởng" text="Luồng lessor/seller/shop-owner đã bị tắt." />
        </div>
      </Panel>
    </section>
  );
}
