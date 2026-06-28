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
          <RuleCard icon="admin_panel_settings" title="Admin" text="Quản lý hệ thống và cấp quyền SELLER cho tài khoản bán." />
          <RuleCard icon="smart_toy" title="Chatbot" text="Khách hàng được tư vấn tự động qua Chatbot AuraFit." />
          <RuleCard icon="storefront" title="Seller" text="Chỉ tài khoản được Admin cấp quyền mới được đăng đồ cho thuê." />
        </div>
      </Panel>
    </section>
  );
}
