export default function CatalogSearchBar({ searchInputRef, searchTerm, onSearchTermChange, onClearSearch }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border border-[#cfc4c5] bg-white p-4 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-3">
        <span className="material-symbols-outlined text-[#99854e]">search</span>
        <input
          ref={searchInputRef}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full bg-transparent py-3 text-base text-black outline-none placeholder:text-[#999999]"
          placeholder="Tìm theo tên trang phục hoặc phụ kiện..."
          type="search"
        />
      </div>
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="border border-[#cfc4c5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black"
        >
          Xóa từ khóa
        </button>
      )}
    </div>
  );
}
