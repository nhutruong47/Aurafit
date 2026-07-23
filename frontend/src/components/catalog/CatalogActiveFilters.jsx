// Hien thi cac filter dang duoc ap dung trong catalog.
export default function CatalogActiveFilters({ selectedFilter }) {
  if (!selectedFilter.category && !selectedFilter.subcategory && !selectedFilter.tag) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-[#6f6259]">Đang xem:</span>
      {selectedFilter.category && (
        <span className="rounded-full bg-[#e9e1d7] px-3 py-1 text-[#2f251f]">{selectedFilter.category}</span>
      )}
      {selectedFilter.subcategory && (
        <>
          <span className="text-[#b9aa9b]">/</span>
          <span className="rounded-full bg-[#e9e1d7] px-3 py-1 text-[#2f251f]">{selectedFilter.subcategory}</span>
        </>
      )}
      {selectedFilter.tag && (
        <>
          <span className="text-[#b9aa9b]">/</span>
          <span className="rounded-full bg-[#3f7c78] px-3 py-1 text-white">{selectedFilter.tag}</span>
        </>
      )}
    </div>
  );
}
