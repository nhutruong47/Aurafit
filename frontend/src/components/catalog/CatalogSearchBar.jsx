export default function CatalogSearchBar({ searchInputRef, searchTerm, onSearchTermChange, onClearSearch }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#ded2c6] bg-[#fffdfa] p-3 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-3">
        <span className="material-symbols-outlined text-[#3f7c78]">search</span>
        <input
          ref={searchInputRef}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full bg-transparent py-2 text-sm text-[#2f251f] outline-none placeholder:text-[#9b9087]"
          placeholder="Tìm theo tên trang phục hoặc phụ kiện..."
          type="search"
        />
      </div>
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="rounded-md border border-[#ded2c6] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6259] transition hover:border-[#4d3830] hover:text-[#2f251f]"
        >
          Xóa từ khóa
        </button>
      )}
    </div>
  );
}
