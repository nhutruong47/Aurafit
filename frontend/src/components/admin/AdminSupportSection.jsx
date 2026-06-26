// Khu vuc theo doi yeu cau ho tro khach hang trong admin dashboard.
import { Panel } from './AdminDashboardShared';

export default function AdminSupportSection({ supportTickets }) {
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
