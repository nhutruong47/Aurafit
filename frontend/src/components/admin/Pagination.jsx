export default function Pagination({ page, totalPages, totalElements, onPageChange }) {
  if (totalPages <= 1) return null;

  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  const handlePrev = () => {
    if (!isFirst) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (!isLast) onPageChange(page + 1);
  };

  return (
    <div className="flex items-center justify-between border-t border-[#d7d2c8] pt-4 mt-4 text-sm text-[#111111]/70">
      <div>
        Hiển thị trang <span className="font-semibold text-[#111111]">{page + 1}</span> / <span className="font-semibold text-[#111111]">{totalPages}</span> 
        (Tổng: {totalElements})
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={isFirst}
          className={`flex h-8 w-8 items-center justify-center rounded border border-[#d7d2c8] transition ${
            isFirst ? 'opacity-50 cursor-not-allowed bg-transparent' : 'hover:bg-[#111111] hover:text-white bg-white text-[#111111]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <button
          onClick={handleNext}
          disabled={isLast}
          className={`flex h-8 w-8 items-center justify-center rounded border border-[#d7d2c8] transition ${
            isLast ? 'opacity-50 cursor-not-allowed bg-transparent' : 'hover:bg-[#111111] hover:text-white bg-white text-[#111111]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
