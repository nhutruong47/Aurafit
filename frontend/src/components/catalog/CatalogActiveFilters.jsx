// Hien thi cac filter dang duoc ap dung trong catalog.
export default function CatalogActiveFilters({ selectedFilter }) {
  if (!selectedFilter.category && !selectedFilter.subcategory && !selectedFilter.tag) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-[#777777]">Đang xem:</span>
      {selectedFilter.category && (
        <span className="rounded-full bg-[#f0f0f0] px-3 py-1 text-black">{selectedFilter.category}</span>
      )}
      {selectedFilter.subcategory && (
        <>
          <span className="text-[#cfc4c5]">/</span>
          <span className="rounded-full bg-[#f0f0f0] px-3 py-1 text-black">{selectedFilter.subcategory}</span>
        </>
      )}
      {selectedFilter.tag && (
        <>
          <span className="text-[#cfc4c5]">/</span>
          <span className="rounded-full bg-[#99854e] px-3 py-1 text-white">{selectedFilter.tag}</span>
        </>
      )}
    </div>
  );
}
