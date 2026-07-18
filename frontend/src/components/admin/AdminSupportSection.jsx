// Khu vuc theo doi yeu cau ho tro khach hang trong admin dashboard.
import { Panel } from './AdminDashboardShared';

const supportTickets = [
  { id: 'SP-2198', customer: 'Minh Anh', subject: 'Chưa nhận hoàn cọc', channel: 'Chat', status: 'Đang xử lý', owner: 'Admin' },
  { id: 'SP-2187', customer: 'Quốc Huy', subject: 'Muốn đổi lịch nhận đồ', channel: 'Hotline', status: 'Mới', owner: 'Admin' },
  { id: 'SP-2172', customer: 'Bảo Trân', subject: 'Lỗi thanh toán chuyển khoản', channel: 'Email', status: 'Đã phản hồi', owner: 'Admin' },
];

export default function AdminSupportSection() {
  return (
    <Panel title="Hỗ trợ khách hàng" action={`${supportTickets.length} yêu cầu`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#d7d2c8] text-[11px] uppercase tracking-[0.16em] text-[#777777]">
              <th className="py-3 pr-4 font-semibold">Mã</th>
              <th className="py-3 pr-4 font-semibold">Khách hàng</th>
              <th className="py-3 pr-4 font-semibold">Nội dung</th>
              <th className="py-3 pr-4 font-semibold">Kênh</th>
              <th className="py-3 pr-4 font-semibold">Phụ trách</th>
            </tr>
          </thead>
          <tbody>
            {supportTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-[#ebe7df]">
                <td className="py-4 pr-4 font-mono text-xs text-[#7f7041]">{ticket.id}</td>
                <td className="py-4 pr-4 font-medium">{ticket.customer}</td>
                <td className="py-4 pr-4">{ticket.subject}</td>
                <td className="py-4 pr-4">{ticket.channel}</td>
                <td className="py-4 pr-4">{ticket.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
