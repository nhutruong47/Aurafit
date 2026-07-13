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
  const runtimeReasoning = analytics?.runtimeReasoning || null;
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
          label: 'Phien AI Stylist',
          value: `${aiStylist?.sessionsStarted || 0}`,
          delta: `${aiStylist?.userMessages || 0} user message`,
        },
        {
          label: 'Rent tu AI Stylist',
          value: `${aiStylist?.attributedRents || 0}`,
          delta: `${aiStylist?.attributedAddToCarts || 0} add-to-cart co attribution`,
        },
        {
          label: 'Search + chat query',
          value: `${overview.searches || 0}`,
          delta: `${overview.productViews || 0} luot xem san pham`,
        },
        {
          label: 'Reasoning fallback',
          value: `${runtimeReasoning?.totalFallbacks || 0}`,
          delta: runtimeReasoning?.circuitOpen ? 'Circuit breaker dang bat' : 'Runtime guardrail',
        },
      ]
    : [];

  return (
    <section className="space-y-6">
      <Panel
        title="Recommendation Analytics"
        action={analytics ? `${analytics.startDate} -> ${analytics.endDate}` : 'Du lieu van hanh'}
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
              {days} ngay
            </button>
          ))}
          {analytics?.generatedAt && (
            <StatusBadge label={`Cap nhat ${analytics.generatedAt.slice(0, 19)}`} tone="default" />
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {isLoading && <p className="mt-4 text-sm text-[#5f5e5e]">Dang tai so lieu recommendation...</p>}
      </Panel>

      {metricCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metricCards.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Hieu qua theo slot">
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
            <p className="text-sm text-[#5f5e5e]">Chua co du lieu click/impression cho recommendation.</p>
          )}
        </Panel>

        <Panel title="AI Stylist Funnel">
          {aiStylist ? (
            <div className="space-y-4">
              {[
                ['Phien chat bat dau', aiStylist.sessionsStarted],
                ['Tin nhan nguoi dung', aiStylist.userMessages],
                ['Tin nhan assistant', aiStylist.assistantMessages],
                ['Impression tu chat', aiStylist.recommendationImpressions],
                ['Click tu chat', aiStylist.recommendationClicks],
                ['Rent co attribution', aiStylist.attributedRents],
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
            <p className="text-sm text-[#5f5e5e]">Chua co du lieu AI Stylist trong giai doan nay.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Reasoning Guardrails">
          {runtimeReasoning ? (
            <div className="space-y-4">
              {[
                ['Tong request reasoning', runtimeReasoning.totalRequests],
                ['Tong fallback', runtimeReasoning.totalFallbacks],
                ['Timeout fallback', runtimeReasoning.timeoutFallbacks],
                ['Parse fallback', runtimeReasoning.parseErrorFallbacks],
                ['Rate-limit fallback', runtimeReasoning.rateLimitFallbacks],
                ['Circuit-open fallback', runtimeReasoning.circuitOpenFallbacks],
                ['Clarification response', runtimeReasoning.clarificationResponses],
                ['No-match response', runtimeReasoning.noMatchResponses],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#ebe7df] pb-3">
                  <p className="text-sm">{label}</p>
                  <p className="font-serif text-2xl italic">{value}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <StatusBadge
                  label={
                    runtimeReasoning.circuitOpen
                      ? `Circuit OPEN ${runtimeReasoning.circuitOpenUntil ? `den ${runtimeReasoning.circuitOpenUntil.slice(11, 19)}` : ''}`
                      : 'Circuit dang closed'
                  }
                  tone={runtimeReasoning.circuitOpen ? 'warning' : 'success'}
                />
                <StatusBadge
                  label={`Recent failure rate ${formatPercent(runtimeReasoning.recentFailureRatePercent)}`}
                  tone="default"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#5f5e5e]">Chua co runtime metric cho reasoning layer.</p>
          )}
        </Panel>

        <Panel title="Top Costume Duoc Click">
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
            <p className="text-sm text-[#5f5e5e]">Chua co costume nao duoc click tu recommendation.</p>
          )}
        </Panel>

        <Panel title="Timeline 7 Ngay Gan Nhat">
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
            <p className="text-sm text-[#5f5e5e]">Chua co timeline su kien trong giai doan nay.</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
