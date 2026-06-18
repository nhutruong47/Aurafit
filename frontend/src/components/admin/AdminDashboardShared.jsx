// Tap hop component dung chung cho cac khu vuc trong admin dashboard.
export function AdminField({ label, name, value, onChange, type = 'text', multiline = false }) {
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
          value={value}
          onChange={onChange}
          type={type}
          required={['name', 'rentalPrice', 'depositPrice'].includes(name)}
          className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      )}
    </label>
  );
}

export function MetricCard({ label, value, delta }) {
  return (
    <article className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777777]">{label}</p>
      <p className="mt-5 font-serif text-5xl italic leading-none text-black">{value}</p>
      <p className="mt-4 text-sm text-[#5f5e5e]">{delta}</p>
    </article>
  );
}

export function RuleCard({ icon, title, text }) {
  return (
    <div className="border border-[#ebe7df] bg-[#fafaf8] p-5">
      <span className="material-symbols-outlined text-[#7f7041]">{icon}</span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">{text}</p>
    </div>
  );
}

export function Panel({ title, action, children }) {
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

export function StatusBadge({ label, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'border-green-200 bg-green-50 text-green-700'
      : tone === 'warning'
        ? 'border-[#e5d7a8] bg-[#fbf7e8] text-[#7f7041]'
        : 'border-[#d7d2c8] bg-white text-[#5f5e5e]';

  return (
    <span className={`inline-flex w-fit border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass}`}>
      {label}
    </span>
  );
}
