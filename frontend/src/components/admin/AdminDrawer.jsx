import { useEffect, useRef } from 'react';

/**
 * Slide-out drawer panel from the right side of the screen.
 * Used for all admin create/edit forms.
 */
export default function AdminDrawer({ isOpen, onClose, title, children, width = 'max-w-lg' }) {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer Panel */}
      <aside
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-full ${width} flex-col bg-[#fdfdfb] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d7d2c8] px-6 py-5">
          <h2 className="font-serif text-2xl italic text-black">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-[#5f5e5e] transition hover:bg-[#f0ede6] hover:text-black"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </aside>
    </>
  );
}
