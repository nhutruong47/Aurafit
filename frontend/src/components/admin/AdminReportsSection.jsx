// Khu vuc bao cao tong hop va xu huong hoat dong cho admin.
import { Panel } from './AdminDashboardShared';

export default function AdminReportsSection({ availableProductCount }) {
  return (
    <Panel title="Báo cáo nhanh">
      <div className="space-y-4">
        {[
          ['Tỷ lệ đơn hoàn tất', '84.7%', '+3.2% so với tuần trước'],
          ['Thời gian phản hồi admin', '11 phút', 'mục tiêu dưới 15 phút'],
          ['Sản phẩm còn hàng', `${availableProductCount}`, 'cập nhật từ database'],
        ].map(([label, value, note]) => (
          <div key={label} className="flex items-end justify-between border-b border-[#ebe7df] pb-4">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-1 text-xs text-[#777777]">{note}</p>
            </div>
            <p className="font-serif text-3xl italic">{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
