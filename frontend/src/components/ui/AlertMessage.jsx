// Thong bao ngan theo tone thanh cong hoac loi.
export default function AlertMessage({ tone = 'error', text, className = '' }) {
  const toneClass =
    tone === 'success'
      ? 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]'
      : 'border-[#ba1a1a]/30 bg-[#ffdad6] text-[#93000a]';

  return <div className={`border px-4 py-3 text-sm font-medium ${toneClass} ${className}`}>{text}</div>;
}
