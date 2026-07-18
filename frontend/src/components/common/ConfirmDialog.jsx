import { useEffect } from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Xóa', cancelLabel = 'Hủy' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_0.2s_ease-out]"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
    >
      <div className="w-full max-w-md bg-white p-6 shadow-xl animate-[slideUp_0.2s_ease-out]">
        <h3 className="mb-2 font-serif text-2xl font-normal uppercase italic text-black">{title}</h3>
        <p className="mb-8 text-sm text-[#5f5e5e]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-[#cfc4c5] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666] transition hover:bg-[#f3f3f4]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="border border-[#ba1a1a] bg-[#ba1a1a] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#9a1515]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
