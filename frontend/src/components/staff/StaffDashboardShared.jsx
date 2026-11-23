// Tap hop component dung chung cho staff dashboard.
import { getDetailStatusLabel } from './StaffDashboardUtils';
const statusTone = {
  PENDING: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
  CONFIRMED: 'border-[#A98A55]/30 bg-[#f8f4e8] text-[#725f2f]',
  PICKED_UP: 'border-[#1c6b9a]/30 bg-[#e8f4fb] text-[#165276]',
  RETURNED: 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]',
  COMPLETED: 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]',
  CANCELLED: 'border-[#DED2C2] bg-[#f4f4f4] text-[#6B6259]',
  DAMAGED: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
  LOST: 'border-[#ba1a1a]/30 bg-[#ffdad6] text-[#93000a]',
  NOT_RETURNED: 'border-[#DED2C2] bg-[#F1EAE0] text-[#211E1B]',
  RETURNED_GOOD: 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]',
  LATE: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
};

export function Metric({ label, value, icon }) {
  return (
    <div className="border border-[#DED2C2] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6259]">{label}</span>
        <span className="material-symbols-outlined text-[#756536]">{icon}</span>
      </div>
      <p className="font-serif text-3xl italic">{value}</p>
    </div>
  );
}

export function StatusBadge({ status, label }) {
  return (
    <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusTone[status] || 'border-[#DED2C2] bg-white text-[#6B6259]'}`}>
      {label || getDetailStatusLabel(status) || status}
    </span>
  );
}

export function SmallFact({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B6259]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6259]">{label}</span>
      {children}
    </label>
  );
}

export function Skeleton({ className }) {
  return <div className={`animate-pulse border border-[#DED2C2] bg-white ${className}`} />;
}
