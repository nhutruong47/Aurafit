// Sidebar bo loc va goi y phu kien cho trang Cosplay.
import CostumeCheckboxFilterGroup from '../costume/CostumeCheckboxFilterGroup';

export default function CosplayFilterSidebar({
  availableFilterGroups,
  selectedFilters,
  onToggleFilter,
  activeFilterCount,
  onClearFilters,
  accessoryHints,
}) {
  return (
    <div className="sticky top-28 space-y-8">
      <div className="flex items-center justify-between border-b border-[#cfc4c5] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#999999]">Bộ lọc</p>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#99854e] hover:text-black"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {availableFilterGroups.map((group) => (
        <CostumeCheckboxFilterGroup
          key={group.key}
          title={group.title}
          items={group.items}
          selectedItems={selectedFilters[group.key]}
          onToggle={(item) => onToggleFilter(group.key, item)}
        />
      ))}

      <div className="border border-[#cfc4c5] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Gợi ý phụ kiện</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {accessoryHints.map((hint) => (
            <button
              key={hint}
              className="border border-[#cfc4c5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
