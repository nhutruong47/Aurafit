import { useMemo } from 'react';
import { useAdminRevenue } from '../../hooks/useAdminRevenue';
import { formatCurrency } from '../../utils/formatCurrency';
import AlertMessage from '../ui/AlertMessage';
import EmptyState from '../ui/EmptyState';
import Pagination from './Pagination';

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

const formatChartDate = (value) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T00:00:00`)
  );

export default function AdminRevenueSection() {
  const {
    startDate,
    endDate,
    keyword,
    page,
    transactions,
    chartData,
    totalPages,
    totalElements,
    isLoading,
    error,
    setPage,
    changeKeyword,
    changeStartDate,
    changeEndDate,
  } = useAdminRevenue();

  const periodRevenue = useMemo(
    () => chartData.reduce((total, item) => total + Number(item.dailyRevenue || 0), 0),
    [chartData]
  );
  const maxDailyRevenue = useMemo(
    () => Math.max(...chartData.map((item) => Number(item.dailyRevenue || 0)), 0),
    [chartData]
  );

  return (
    <section className="space-y-5">
      <div className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f7041]">Tài chính</p>
        <h2 className="mt-2 font-serif text-4xl italic">Chi tiết doanh thu</h2>
        <p className="mt-2 text-sm text-[#5f5e5e]">
          Doanh thu gồm phí thuê, phí giao hàng và phần cọc giữ lại do trả trễ hoặc hư hỏng.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Tìm giao dịch</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#777777]">search</span>
              <input
                value={keyword}
                onChange={(event) => changeKeyword(event.target.value)}
                placeholder="Mã đơn, mã giao dịch, khách hàng..."
                className="h-11 w-full border border-[#d7d2c8] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Từ ngày</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => changeStartDate(event.target.value)}
              className="h-11 w-full border border-[#d7d2c8] bg-white px-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Đến ngày</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => changeEndDate(event.target.value)}
              className="h-11 w-full border border-[#d7d2c8] bg-white px-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
        </div>
      </div>

      {error && <AlertMessage text={error} />}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Doanh thu trong kỳ</p>
          <p className="mt-4 font-serif text-4xl italic">{isLoading ? '—' : formatCurrency(periodRevenue)}</p>
          <p className="mt-3 text-sm text-[#5f5e5e]">Không bao gồm phần tiền cọc được hoàn lại cho khách.</p>
        </article>
        <article className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Giao dịch tìm thấy</p>
          <p className="mt-4 font-serif text-4xl italic">{isLoading ? '—' : totalElements}</p>
          <p className="mt-3 text-sm text-[#5f5e5e]">Kết quả sau khi áp dụng khoảng ngày và từ khóa.</p>
        </article>
      </div>

      <div className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="font-serif text-3xl italic">Doanh thu theo ngày</h3>
          <span className="text-xs text-[#777777]">{chartData.length} ngày có giao dịch</span>
        </div>
        {isLoading ? (
          <div className="flex h-56 items-center justify-center gap-3 text-sm text-[#5f5e5e]">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải biểu đồ...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#777777]">Chưa có doanh thu trong khoảng ngày này.</div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex h-64 min-w-full items-end gap-2 border-b border-[#d7d2c8] px-2" style={{ width: Math.max(chartData.length * 52, 640) }}>
              {chartData.map((item) => {
                const amount = Number(item.dailyRevenue || 0);
                const height = maxDailyRevenue > 0 ? Math.max((amount / maxDailyRevenue) * 190, 4) : 4;
                return (
                  <div key={item.date} className="group flex min-w-10 flex-1 flex-col items-center justify-end self-stretch pt-8">
                    <div className="relative flex w-full flex-1 items-end justify-center">
                      <span className="pointer-events-none absolute bottom-[calc(100%+6px)] hidden whitespace-nowrap bg-black px-2 py-1 text-[10px] text-white group-hover:block">
                        {formatCurrency(amount)}
                      </span>
                      <div className="w-full max-w-8 bg-[#7f7041] transition group-hover:bg-black" style={{ height }} />
                    </div>
                    <span className="mt-2 pb-2 text-[10px] text-[#777777]">{formatChartDate(item.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden border border-[#d7d2c8] bg-[#fdfdfb]">
        <div className="flex items-center justify-between border-b border-[#d7d2c8] px-5 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em]">Giao dịch đã thanh toán</h3>
          <span className="text-sm text-[#5f5e5e]">{totalElements} giao dịch</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#5f5e5e]">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải giao dịch...
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="payments"
            title="Chưa có giao dịch"
            message="Không tìm thấy giao dịch thanh toán thành công phù hợp với bộ lọc."
            className="border-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-[#f4f4f2] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666]">
                <tr>
                  <th className="px-5 py-3">Giao dịch</th>
                  <th className="px-5 py-3">Đơn hàng</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Phương thức</th>
                  <th className="px-5 py-3 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe7df]">
                {transactions.map((transaction) => (
                  <tr key={transaction.paymentId} className="transition hover:bg-[#faf8f2]">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{transaction.transactionId || `PAY-${transaction.paymentId}`}</p>
                      <p className="mt-1 text-xs text-green-700">Đã thanh toán</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium">RO-{String(transaction.orderId).padStart(4, '0')}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{transaction.customerName || '—'}</p>
                      <p className="mt-1 text-xs text-[#777777]">{transaction.customerEmail || transaction.customerPhone || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#5f5e5e]">{formatDateTime(transaction.paidAt)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#5f5e5e]">{transaction.method === 'BANKING' ? 'Chuyển khoản' : transaction.method}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 pb-5">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
          />
        </div>
      </div>
    </section>
  );
}
