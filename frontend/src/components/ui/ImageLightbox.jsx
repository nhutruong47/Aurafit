import { useEffect } from 'react';

export default function ImageLightbox({ images = [], activeIndex = 0, onIndexChange, onClose }) {
  const imageUrl = images[activeIndex];

  useEffect(() => {
    if (!imageUrl) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && images.length > 1) {
        onIndexChange((activeIndex - 1 + images.length) % images.length);
      } else if (event.key === 'ArrowRight' && images.length > 1) {
        onIndexChange((activeIndex + 1) % images.length);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, imageUrl, images.length, onClose, onIndexChange]);

  if (!imageUrl) return null;

  const showNavigation = images.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh đánh giá"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng ảnh"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-white hover:text-black"
      >
        <span className="material-symbols-outlined text-[28px]">close</span>
      </button>

      {showNavigation && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onIndexChange((activeIndex - 1 + images.length) % images.length);
          }}
          aria-label="Ảnh trước"
          className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-white hover:text-black md:left-8"
        >
          <span className="material-symbols-outlined text-[30px]">chevron_left</span>
        </button>
      )}

      <img
        src={imageUrl}
        alt={`Ảnh đánh giá ${activeIndex + 1}`}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] object-contain shadow-2xl"
      />

      {showNavigation && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onIndexChange((activeIndex + 1) % images.length);
          }}
          aria-label="Ảnh sau"
          className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-white hover:text-black md:right-8"
        >
          <span className="material-symbols-outlined text-[30px]">chevron_right</span>
        </button>
      )}

      <span className="absolute bottom-4 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white">
        {activeIndex + 1}/{images.length}
      </span>
    </div>
  );
}
