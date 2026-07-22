export default function CatalogSearchBar({ searchInputRef, searchTerm, onSearchTermChange, onClearSearch }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border border-gray-200 bg-white p-3 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-3">
        <span className="material-symbols-outlined text-[#99854e]">search</span>
        <input
          ref={searchInputRef}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full bg-transparent py-2 text-sm text-black outline-none placeholder:text-[#999999]"
          placeholder="Tìm theo tên trang phục hoặc phụ kiện..."
          type="search"
        />
      </div>
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="border border-gray-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black"
        >
          Xóa từ khóa
        </button>
      )}
    </div>
  );
}
