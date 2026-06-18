// Dieu huong phan trang cho danh sach san pham Shop.
export default function ShopPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center border border-[#cfc4c5] bg-white disabled:cursor-not-allowed disabled:text-[#cfc4c5]"
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-[18px]">west</span>
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-10 min-w-10 border px-3 text-sm font-semibold ${
            page === currentPage
              ? 'border-black bg-black text-white'
              : 'border-[#cfc4c5] bg-white text-black hover:border-[#99854e]'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center border border-[#cfc4c5] bg-white disabled:cursor-not-allowed disabled:text-[#cfc4c5]"
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-[18px]">east</span>
      </button>
    </div>
  );
}
