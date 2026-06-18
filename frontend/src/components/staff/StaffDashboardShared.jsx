// Tap hop component dung chung cho staff dashboard.
const statusTone = {
  PENDING_PAYMENT: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
  PENDING_CONFIRMATION: 'border-[#99854e]/30 bg-[#f8f4e8] text-[#725f2f]',
  PICKED_UP: 'border-[#1c6b9a]/30 bg-[#e8f4fb] text-[#165276]',
  RETURNED: 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]',
  DAMAGED: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
  LOST: 'border-[#ba1a1a]/30 bg-[#ffdad6] text-[#93000a]',
};

export function Metric({ label, value, icon }) {
  return (
    <div className="border border-[#cfc4c5] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
        <span className="material-symbols-outlined text-[#99854e]">{icon}</span>
      </div>
      <p className="font-serif text-3xl italic">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusTone[status] || 'border-[#cfc4c5] bg-white text-[#5f5e5e]'}`}>
      {status}
    </span>
  );
}

export function SmallFact({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
      {children}
    </label>
  );
}

export function Skeleton({ className }) {
  return <div className={`animate-pulse border border-[#cfc4c5] bg-white ${className}`} />;
}
