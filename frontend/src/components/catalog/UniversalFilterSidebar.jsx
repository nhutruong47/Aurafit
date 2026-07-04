import CostumeCheckboxFilterGroup from '../costume/CostumeCheckboxFilterGroup';

export default function UniversalFilterSidebar({
  filterGroups,
  selectedIds,
  onToggle,
  onClearAll,
  children,
}) {
  return (
    <div className="sticky top-28 space-y-8">
      <div className="flex items-center justify-between border-b border-[#cfc4c5] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#999999]">Bộ lọc</p>
      </div>

      {filterGroups.map((group) => (
        <CostumeCheckboxFilterGroup
          key={group.title}
          title={group.title}
          items={group.options}
          selectedItems={selectedIds}
          onToggle={onToggle}
        />
      ))}

      {children}

      <button
        onClick={onClearAll}
        className="w-full border border-black bg-white py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
