import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#473a33] text-[#c9ae68] shadow-lg transition-all duration-300 hover:bg-[#3b2f29] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#c9ae68] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
    </button>
  );
}
