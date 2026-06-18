import { useMemo, useState } from 'react';

const notifications = [
  {
    id: 'NOTI-1842',
    type: 'Hệ thống',
    title: 'Tỷ lệ thanh toán thành công giảm nhẹ',
    detail: 'VNPAY ghi nhận 7 giao dịch timeout trong 30 phút gần nhất.',
    severity: 'warning',
    time: '09:42',
    unread: true,
  },
  {
    id: 'NOTI-1839',
    type: 'Kho vận',
    title: 'Có 4 đơn sắp quá hạn trả đồ',
    detail: 'Staff cần gọi nhắc khách trước 16:00 hôm nay.',
    severity: 'info',
    time: '08:15',
    unread: true,
  },
  {
    id: 'NOTI-1831',
    type: 'Hỗ trợ',
    title: 'Ticket khiếu nại cọc đang chờ phản hồi',
    detail: 'Khách yêu cầu kiểm tra lại phí bồi thường đơn #RO-2198.',
    severity: 'critical',
    time: 'Hôm qua',
    unread: false,
  },
];

const supportTickets = [
  {
    id: 'SP-2198',
    customer: 'Minh Anh',
    subject: 'Chưa nhận hoàn cọc',
    channel: 'Chat',
    status: 'Đang xử lý',
    priority: 'Cao',
    owner: 'Staff Lan',
    updatedAt: '12 phút trước',
  },
  {
    id: 'SP-2187',
    customer: 'Quốc Huy',
    subject: 'Muốn đổi lịch nhận đồ',
    channel: 'Hotline',
    status: 'Mới',
    priority: 'Trung bình',
    owner: 'Chưa gán',
    updatedAt: '28 phút trước',
  },
  {
    id: 'SP-2172',
    customer: 'Bảo Trân',
    subject: 'Lỗi thanh toán banking',
    channel: 'Email',
    status: 'Đã phản hồi',
    priority: 'Trung bình',
    owner: 'Staff Nam',
    updatedAt: '1 giờ trước',
  },
];

const activityLog = [
  ['09:58', 'Staff cập nhật 3 đơn trả đồ thành RETURNED'],
  ['09:21', 'Hệ thống ghi nhận 12 lượt chat AI trong 1 giờ'],
  ['08:47', 'Kho Cosplay còn 6 item đang bảo trì'],
  ['08:05', 'Payment service hoạt động bình thường'],
];

const metricCards = [
  { label: 'Đơn đang xử lý', value: '47', delta: '+8 hôm nay', tone: 'default' },
  { label: 'Doanh thu hôm nay', value: '18.6M', delta: '+12.4%', tone: 'good' },
  { label: 'Ticket mở', value: '11', delta: '3 ưu tiên cao', tone: 'warning' },
  { label: 'Cảnh báo hệ thống', value: '2', delta: 'cần kiểm tra', tone: 'critical' },
];

export default function AdminDashboard({ currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const isAdmin = currentUser?.role?.split(',').some((role) => role.trim() === 'ADMIN');

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, []);
  const highPriorityCount = useMemo(() => supportTickets.filter((ticket) => ticket.priority === 'Cao').length, []);

  if (!isAdmin) {
    return (
      <div className="bg-[#f4f4f2] text-[#171717]">
        <section className="mx-auto min-h-[calc(100dvh-80px)] max-w-[900px] px-5 py-20 md:px-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7f7041]">Admin</p>
          <h1 className="font-serif text-[46px] font-normal italic leading-tight md:text-[70px]">
            Cần tài khoản ADMIN để truy cập.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#5f5e5e]">
            Đăng nhập bằng tài khoản demo admin để xem số liệu vận hành, thông báo và hỗ trợ khách hàng.
          </p>
          <button
            onClick={() => onNavigate?.('account')}
            className="mt-9 bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            Đăng nhập admin
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[#f4f4f2] text-[#171717]">
      <div className="border-b border-[#d7d2c8] bg-[#fdfdfb]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7f7041]">AuraFit Admin</p>
            <h1 className="mt-2 font-serif text-4xl font-normal italic leading-[1.15] md:text-5xl">
              Trung tâm quản lý vận hành
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:flex md:items-center">
            <StatusBadge label={`${unreadCount} thông báo mới`} tone="warning" />
            <StatusBadge label={`${highPriorityCount} hỗ trợ ưu tiên`} tone="critical" />
            <StatusBadge label="API ổn định" tone="good" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-5 py-8 md:px-10 xl:grid-cols-[240px_1fr]">
        <aside className="h-fit border border-[#d7d2c8] bg-[#111111] p-3 text-white">
          {[
            ['overview', 'Tổng quan', 'dashboard'],
            ['notifications', 'Thông báo', 'notifications'],
            ['support', 'Hỗ trợ', 'support_agent'],
            ['reports', 'Báo cáo', 'monitoring'],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`mb-1 flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                activeTab === id ? 'bg-[#7f7041] text-white' : 'text-white/68 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <main>
          {activeTab === 'overview' && (
            <section>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Panel title="Tình trạng vận hành" action="Cập nhật lúc 10:00">
                  <div className="grid gap-4 md:grid-cols-3">
                    <ServiceHealth label="Payment" value="99.1%" status="Ổn định" />
                    <ServiceHealth label="Chatbot" value="96.8%" status="Theo dõi" tone="warning" />
                    <ServiceHealth label="Database" value="100%" status="Ổn định" />
                  </div>
                  <div className="mt-6 border-t border-[#e2ded6] pt-5">
                    <p className="text-sm leading-7 text-[#5f5e5e]">
                      Admin tập trung theo dõi sức khỏe hệ thống, số lượng đơn, ticket hỗ trợ và thông báo bất thường.
                      Các nghiệp vụ bán hàng, cho thuê hoặc duyệt shop không nằm trong màn hình này.
                    </p>
                  </div>
                </Panel>

                <Panel title="Hoạt động gần đây">
                  <div className="space-y-4">
                    {activityLog.map(([time, text]) => (
                      <div key={`${time}-${text}`} className="grid grid-cols-[64px_1fr] gap-4 text-sm">
                        <span className="font-mono text-xs text-[#7f7041]">{time}</span>
                        <span className="text-[#3f3f3f]">{text}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </section>
          )}

          {activeTab === 'notifications' && (
            <Panel title="Thông báo quản lý" action={`${unreadCount} chưa đọc`}>
              <NotificationList />
            </Panel>
          )}

          {activeTab === 'support' && (
            <Panel title="Hỗ trợ khách hàng" action={`${supportTickets.length} ticket`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d7d2c8] text-[11px] uppercase tracking-[0.16em] text-[#777777]">
                      <th className="py-3 pr-4 font-semibold">Ticket</th>
                      <th className="py-3 pr-4 font-semibold">Khách hàng</th>
                      <th className="py-3 pr-4 font-semibold">Nội dung</th>
                      <th className="py-3 pr-4 font-semibold">Kênh</th>
                      <th className="py-3 pr-4 font-semibold">Trạng thái</th>
                      <th className="py-3 pr-4 font-semibold">Phụ trách</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-[#ebe7df]">
                        <td className="py-4 pr-4 font-mono text-xs text-[#7f7041]">{ticket.id}</td>
                        <td className="py-4 pr-4 font-medium">{ticket.customer}</td>
                        <td className="py-4 pr-4">
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-[#777777]">{ticket.updatedAt}</p>
                        </td>
                        <td className="py-4 pr-4">{ticket.channel}</td>
                        <td className="py-4 pr-4">
                          <StatusBadge label={ticket.status} tone={ticket.priority === 'Cao' ? 'critical' : 'default'} />
                        </td>
                        <td className="py-4 pr-4">{ticket.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {activeTab === 'reports' && (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel title="Báo cáo nhanh">
                <div className="space-y-4">
                  {[
                    ['Tỷ lệ đơn hoàn tất', '84.7%', '+3.2% so với tuần trước'],
                    ['Thời gian phản hồi hỗ trợ', '11 phút', 'mục tiêu dưới 15 phút'],
                    ['Tỷ lệ hoàn cọc đúng hạn', '91.4%', 'cần theo dõi các đơn DAMAGED'],
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

              <Panel title="Nhắc việc quản lý">
                <div className="space-y-3">
                  {[
                    'Kiểm tra ticket hoàn cọc ưu tiên cao.',
                    'Rà soát 4 đơn sắp quá hạn trả đồ.',
                    'Xuất báo cáo doanh thu cuối ngày lúc 21:00.',
                  ].map((task) => (
                    <label key={task} className="flex items-center gap-3 border border-[#ebe7df] bg-[#fafaf8] p-4 text-sm">
                      <input type="checkbox" className="h-4 w-4 accent-[#7f7041]" />
                      <span>{task}</span>
                    </label>
                  ))}
                </div>
              </Panel>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, delta, tone }) {
  const toneClass =
    tone === 'good'
      ? 'text-green-700'
      : tone === 'warning'
        ? 'text-[#7f7041]'
        : tone === 'critical'
          ? 'text-red-700'
          : 'text-black';

  return (
    <article className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777777]">{label}</p>
      <p className={`mt-5 font-serif text-5xl italic leading-none ${toneClass}`}>{value}</p>
      <p className="mt-4 text-sm text-[#5f5e5e]">{delta}</p>
    </article>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl italic">{title}</h2>
        {action && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{action}</p>}
      </div>
      {children}
    </section>
  );
}

function ServiceHealth({ label, value, status, tone = 'good' }) {
  return (
    <div className="border border-[#ebe7df] bg-[#fafaf8] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777777]">{label}</p>
      <p className="mt-4 font-mono text-2xl tabular-nums">{value}</p>
      <StatusBadge label={status} tone={tone} />
    </div>
  );
}

function NotificationList() {
  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <article key={notification.id} className="border border-[#ebe7df] bg-[#fafaf8] p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <StatusBadge label={notification.type} tone={notification.severity} />
                <span className="font-mono text-xs text-[#777777]">{notification.id}</span>
                {notification.unread && <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">Mới</span>}
              </div>
              <h3 className="text-base font-semibold">{notification.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f5e5e]">{notification.detail}</p>
            </div>
            <span className="font-mono text-xs text-[#777777]">{notification.time}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ label, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'border-green-200 bg-green-50 text-green-700'
      : tone === 'warning'
        ? 'border-[#e5d7a8] bg-[#fbf7e8] text-[#7f7041]'
        : tone === 'critical'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-[#d7d2c8] bg-white text-[#5f5e5e]';

  return (
    <span className={`inline-flex w-fit border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass}`}>
      {label}
    </span>
  );
}
