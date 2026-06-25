import { Panel } from './AdminDashboardShared';

function TrendField({ label, name, value, onChange, type = 'text', multiline = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className="min-h-24 w-full resize-none border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      )}
    </label>
  );
}

export default function AdminTrendManagerSection({
  trends,
  trendForm,
  editingTrendId,
  trendMessage,
  trendError,
  isSavingTrend,
  onFieldChange,
  onEditTrend,
  onResetTrendForm,
  onSubmitTrend,
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Panel title={editingTrendId ? 'Sua fashion trend' : 'Them fashion trend'}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitTrend?.();
          }}
        >
          <TrendField label="Trend name" name="trendName" value={trendForm.trendName} onChange={onFieldChange} />
          <TrendField label="Season label" name="seasonLabel" value={trendForm.seasonLabel} onChange={onFieldChange} />
          <TrendField label="Style tags" name="styleTags" value={trendForm.styleTags} onChange={onFieldChange} />
          <TrendField label="Color tags" name="colorTags" value={trendForm.colorTags} onChange={onFieldChange} />
          <TrendField label="Occasion tags" name="occasionTags" value={trendForm.occasionTags} onChange={onFieldChange} />
          <TrendField label="Audience tags" name="audienceTags" value={trendForm.audienceTags} onChange={onFieldChange} />
          <TrendField label="Boost score" name="boostScore" type="number" value={trendForm.boostScore} onChange={onFieldChange} />
          <TrendField label="Source note" name="sourceNote" value={trendForm.sourceNote} onChange={onFieldChange} />
          <TrendField label="Summary text" name="summaryText" value={trendForm.summaryText} onChange={onFieldChange} multiline />
          <div className="grid grid-cols-2 gap-3">
            <TrendField label="Active from" name="activeFrom" type="datetime-local" value={trendForm.activeFrom} onChange={onFieldChange} />
            <TrendField label="Active to" name="activeTo" type="datetime-local" value={trendForm.activeTo} onChange={onFieldChange} />
          </div>

          {trendMessage && <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{trendMessage}</p>}
          {trendError && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{trendError}</p>}

          <button
            disabled={isSavingTrend}
            className="w-full bg-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
          >
            {isSavingTrend ? 'Dang luu trend...' : editingTrendId ? 'Cap nhat trend' : 'Them trend'}
          </button>

          {editingTrendId && (
            <button
              type="button"
              onClick={onResetTrendForm}
              className="w-full border border-[#d7d2c8] py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Huy sua trend
            </button>
          )}
        </form>
      </Panel>

      <Panel title="Trend dang co" action={`${trends.length} trend`}>
        <div className="grid gap-4 md:grid-cols-2">
          {trends.map((trend) => (
            <article key={trend.id} className="border border-[#ebe7df] bg-[#fafaf8] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#99854e]">
                {trend.seasonLabel || 'General'} | boost {trend.boostScore}
              </p>
              <h3 className="mt-2 font-serif text-2xl italic">{trend.trendName}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">{trend.summaryText || 'Chua co summary.'}</p>
              <button
                onClick={() => onEditTrend?.(trend)}
                className="mt-4 border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
              >
                Sua trend
              </button>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}
