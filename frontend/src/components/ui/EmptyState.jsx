// Trang thai rong dung chung voi icon, thong diep va hanh dong tuy chon.
export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`border border-[#DED2C2] bg-white p-10 text-center ${className}`}>
      {icon && <span className="material-symbols-outlined mb-6 block text-[44px] text-[#756536]">{icon}</span>}
      <h2 className="font-serif text-3xl font-normal uppercase italic">{title}</h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#6B6259]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-8 bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#756536]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
