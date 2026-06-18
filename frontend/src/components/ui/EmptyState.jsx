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
    <div className={`border border-[#cfc4c5] bg-white p-10 text-center ${className}`}>
      {icon && <span className="material-symbols-outlined mb-6 block text-[44px] text-[#99854e]">{icon}</span>}
      <h2 className="font-serif text-3xl font-normal uppercase italic">{title}</h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5f5e5e]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-8 bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
