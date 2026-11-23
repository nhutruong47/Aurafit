export default function CatalogSortBar({
  sortBy,
  sortDir,
  displayedCount,
  totalCount,
  isLoading,
  onSortChange,
}) {
  const isActive = (checkSortBy, checkSortDir) => sortBy === checkSortBy && sortDir === checkSortDir;
  const buttonClass = (checkSortBy, checkSortDir) =>
    `shrink-0 rounded-md border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
      isActive(checkSortBy, checkSortDir)
        ? 'border-[#3A302A] bg-[#3A302A] text-white'
        : 'border-[#ded2c6] bg-[#FFFCF7] text-[#3A302A] hover:border-[#3A302A]'
    }`;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[#ded2c6] bg-[#FFFCF7] p-4 xl:flex-row xl:items-center xl:justify-between">
      <p className="shrink-0 text-sm text-[#6f6259]" aria-live="polite">
        {isLoading ? (
          'Đang tải sản phẩm...'
        ) : (
          <>
            Đang hiển thị <span className="font-semibold text-[#2B2521]">{displayedCount}</span> /{' '}
            <span className="font-semibold text-[#2B2521]">{totalCount}</span> trang phục
          </>
        )}
      </p>

      <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto pb-1 xl:justify-end xl:pb-0">
        <span className="mr-1 shrink-0 text-xs font-medium text-[#6f6259]">Sắp xếp theo</span>

        <button onClick={() => onSortChange('id', 'desc')} className={buttonClass('id', 'desc')}>
          Phổ biến
        </button>

        <button
          onClick={() => onSortChange('createdAt', 'desc')}
          className={buttonClass('createdAt', 'desc')}
        >
          Mới nhất
        </button>

        <button
          onClick={() => onSortChange('rentalPrice', 'asc')}
          className={buttonClass('rentalPrice', 'asc')}
        >
          Giá thấp - cao
        </button>

        <button
          onClick={() => onSortChange('rentalPrice', 'desc')}
          className={buttonClass('rentalPrice', 'desc')}
        >
          Giá cao - thấp
        </button>
      </div>
    </div>
  );
}
