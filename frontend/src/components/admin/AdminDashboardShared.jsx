// Tap hop component dung chung cho cac khu vuc trong admin dashboard.
export function AdminField({ label, name, value, onChange, type = 'text', multiline = false, required }) {
  const isRequired = required ?? ['name', 'rentalPrice', 'depositPrice'].includes(name);

  const handleCurrencyChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    onChange({
      target: {
        name,
        value: rawValue
      }
    });
  };

  const displayValue = type === 'currency' && value ? Number(value).toLocaleString('vi-VN') : value;

  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={isRequired}
          className="min-h-24 w-full resize-none border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      ) : type === 'currency' ? (
        <input
          name={name}
          value={displayValue}
          onChange={handleCurrencyChange}
          type="text"
          required={isRequired}
          className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          required={isRequired}
          className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      )}
    </label>
  );
}

export function MetricCard({ label, value, delta, onClick }) {
  const content = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777777]">{label}</p>
      <p className="mt-5 break-words font-serif text-4xl italic leading-none text-black xl:text-5xl">{value}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#5f5e5e]">
        <span>{delta}</span>
        {onClick && <span className="material-symbols-outlined text-[20px] text-[#7f7041]">arrow_forward</span>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Xem chi tiết ${label}`}
        className="border border-[#d7d2c8] bg-[#fdfdfb] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#7f7041] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7f7041]/40"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      {content}
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
        {action && (
          typeof action === 'string'
            ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{action}</p>
            : action
        )}
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
