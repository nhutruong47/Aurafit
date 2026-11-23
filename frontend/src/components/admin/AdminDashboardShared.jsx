// Tap hop component dung chung cho cac khu vuc trong admin dashboard.
export function AdminField({ label, name, value, onChange, type = 'text', multiline = false, required, minLength }) {
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
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B6259]">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={isRequired}
          minLength={minLength}
          className="min-h-24 w-full resize-none border border-[#DED2C2] bg-[#FAF5ED] px-3 py-3 text-sm outline-none focus:border-[#756536]"
        />
      ) : type === 'currency' ? (
        <input
          name={name}
          value={displayValue}
          onChange={handleCurrencyChange}
          type="text"
          required={isRequired}
          className="w-full border border-[#DED2C2] bg-[#FAF5ED] px-3 py-3 text-sm outline-none focus:border-[#756536]"
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          required={isRequired}
          minLength={minLength}
          className="w-full border border-[#DED2C2] bg-[#FAF5ED] px-3 py-3 text-sm outline-none focus:border-[#756536]"
        />
      )}
    </label>
  );
}

export function MetricCard({ label, value, delta, onClick }) {
  const content = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6259]">{label}</p>
      <p className="mt-5 break-words font-serif text-4xl italic leading-none text-black xl:text-5xl">{value}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#6B6259]">
        <span>{delta}</span>
        {onClick && <span className="material-symbols-outlined text-[20px] text-[#756536]">arrow_forward</span>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Xem chi tiết ${label}`}
        className="border border-[#DED2C2] bg-[#FFFCF7] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#756536] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#756536]/40"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="border border-[#DED2C2] bg-[#FFFCF7] p-6">
      {content}
    </article>
  );
}

export function RuleCard({ icon, title, text }) {
  return (
    <div className="border border-[#E8DDCE] bg-[#FAF5ED] p-5">
      <span className="material-symbols-outlined text-[#756536]">{icon}</span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6B6259]">{text}</p>
    </div>
  );
}

export function Panel({ title, action, children }) {
  return (
    <section className="border border-[#DED2C2] bg-[#FFFCF7] p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl italic">{title}</h2>
        {action && (
          typeof action === 'string'
            ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6259]">{action}</p>
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
        ? 'border-[#e5d7a8] bg-[#fbf7e8] text-[#756536]'
        : 'border-[#DED2C2] bg-white text-[#6B6259]';

  return (
    <span className={`inline-flex w-fit border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass}`}>
      {label}
    </span>
  );
}
