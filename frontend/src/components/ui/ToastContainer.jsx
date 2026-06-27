import { useEffect, useState } from 'react';
import { useToastStore } from '../../store/useToastStore';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const isSuccess = toast.type === 'success';
  const bg = isSuccess ? 'bg-[#087b3f]' : 'bg-[#ba1a1a]';
  const icon = isSuccess ? (
    <span className="material-symbols-outlined text-[18px] text-white">check_circle</span>
  ) : (
    <span className="material-symbols-outlined text-[18px] text-white">error</span>
  );

  return (
    <div
      className={`pointer-events-auto flex min-w-[280px] max-w-[360px] items-center gap-3 border-l-4 ${bg} px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {icon}
      <p className="flex-1 text-sm font-medium text-white">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="ml-2 flex-shrink-0 text-white/70 hover:text-white"
        aria-label="Đóng"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
