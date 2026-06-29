// Khu vuc bao cao recommendation va AI Stylist cho admin.
import { MetricCard, Panel, StatusBadge } from './AdminDashboardShared';

const PERIOD_OPTIONS = [7, 30, 60];

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

export default function AdminReportsSection({
  analytics,
  isLoading,
  error,
  periodDays,
  onPeriodDaysChange,
}) {
  const overview = analytics?.overview || null;
  const aiStylist = analytics?.aiStylist || null;
  const slotPerformance = Array.isArray(analytics?.slotPerformance) ? analytics.slotPerformance : [];
  const topClickedCostumes = Array.isArray(analytics?.topClickedCostumes) ? analytics.topClickedCostumes : [];
  const dailyPerformance = Array.isArray(analytics?.dailyPerformance) ? analytics.dailyPerformance : [];

  const metricCards = overview
    ? [
        {
          label: 'CTR recommendation',
          value: formatPercent(overview.recommendationCtr),
          delta: `${overview.recommendationClicks} click / ${overview.recommendationImpressions} impression`,
        },
        {
          label: 'Phiên AI Stylist',
          value: `${aiStylist?.sessionsStarted || 0}`,
          delta: `${aiStylist?.userMessages || 0} user message`,
        },
        {
          label: 'Rent từ AI Stylist',
          value: `${aiStylist?.attributedRents || 0}`,
          delta: `${aiStylist?.attributedAddToCarts || 0} add-to-cart có attribution`,
        },
        {
          label: 'Search + chat query',
          value: `${overview.searches}`,
          delta: `${overview.productViews} lượt xem sản phẩm`,
        },
      ]
    : [];

  return (
    <section className="space-y-6">
      <Panel
        title="Recommendation Analytics"
        action={analytics ? `${analytics.startDate} → ${analytics.endDate}` : 'Dữ liệu vận hành'}
      >
        <div className="flex flex-wrap items-center gap-3">
          {PERIOD_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onPeriodDaysChange?.(days)}
              className={`border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                periodDays === days
                  ? 'border-[#7f7041] bg-[#7f7041] text-white'
                  : 'border-[#d7d2c8] bg-white text-[#5f5e5e] hover:border-[#7f7041] hover:text-black'
              }`}
            >
              {days} ngày
            </button>
          ))}
          {analytics?.generatedAt && <StatusBadge label={`Cập nhật ${analytics.generatedAt.slice(0, 19)}`} tone="default" />}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {isLoading && <p className="mt-4 text-sm text-[#5f5e5e]">Đang tải số liệu recommendation...</p>}
      </Panel>

      {metricCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Hiệu quả theo slot">
          {slotPerformance.length ? (
            <div className="space-y-4">
              {slotPerformance.map((slot) => (
                <div key={slot.slot} className="flex items-end justify-between border-b border-[#ebe7df] pb-4">
                  <div>
                    <p className="text-sm font-semibold">{slot.slot}</p>
                    <p className="mt-1 text-xs text-[#777777]">
                      {slot.clicks} click / {slot.impressions} impression
                    </p>
                  </div>
                  <p className="font-serif text-3xl italic">{formatPercent(slot.ctr)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f5e5e]">Chưa có dữ liệu click/impression cho recommendation.</p>
          )}
        </Panel>

        <Panel title="AI Stylist Funnel">
          {aiStylist ? (
            <div className="space-y-4">
              {[
                ['Phiên chat bắt đầu', aiStylist.sessionsStarted],
                ['Tin nhắn người dùng', aiStylist.userMessages],
                ['Tin nhắn assistant', aiStylist.assistantMessages],
                ['Impression từ chat', aiStylist.recommendationImpressions],
                ['Click từ chat', aiStylist.recommendationClicks],
                ['Rent có attribution', aiStylist.attributedRents],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#ebe7df] pb-3">
                  <p className="text-sm">{label}</p>
                  <p className="font-serif text-2xl italic">{value}</p>
                </div>
              ))}
              <div className="pt-2">
                <StatusBadge label={`CTR chat ${formatPercent(aiStylist.recommendationCtr)}`} tone="warning" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#5f5e5e]">Chưa có dữ liệu AI Stylist trong giai đoạn này.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Top Costume Được Click">
          {topClickedCostumes.length ? (
            <div className="space-y-3">
              {topClickedCostumes.map((costume, index) => (
                <div key={costume.costumeId} className="flex items-center justify-between border-b border-[#ebe7df] pb-3">
                  <div>
                    <p className="text-sm font-semibold">
                      #{index + 1} {costume.costumeName}
                    </p>
                    <p className="mt-1 text-xs text-[#777777]">ID {costume.costumeId}</p>
                  </div>
                  <p className="font-serif text-2xl italic">{costume.clickCount}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f5e5e]">Chưa có costume nào được click từ recommendation.</p>
          )}
        </Panel>

        <Panel title="Timeline 7 Ngày Gần Nhất">
          {dailyPerformance.length ? (
            <div className="space-y-3">
              {dailyPerformance.slice(-7).reverse().map((day) => (
                <div key={day.date} className="grid grid-cols-[90px_1fr_1fr_1fr] items-center gap-3 border-b border-[#ebe7df] pb-3 text-sm">
                  <p className="font-semibold">{day.date.slice(5)}</p>
                  <p>Imp {day.recommendationImpressions}</p>
                  <p>Click {day.recommendationClicks}</p>
                  <p>AI rent {day.aiAttributedRents}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f5e5e]">Chưa có timeline sự kiện trong giai đoạn này.</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
