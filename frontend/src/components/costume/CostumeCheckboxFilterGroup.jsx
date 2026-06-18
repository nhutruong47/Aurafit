// Nhom checkbox filter dung chung cho cac trang costume.
export default function CostumeCheckboxFilterGroup({
  title,
  items,
  selectedItems,
  onToggle,
}) {
  const isControlled = Array.isArray(selectedItems) && typeof onToggle === 'function';

  return (
    <div className="border-b border-[#cfc4c5] pb-7">
      <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#999999]">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const inputProps = isControlled
            ? {
                checked: selectedItems.includes(item),
                onChange: () => onToggle(item),
              }
            : {};

          return (
            <label key={item} className="flex cursor-pointer items-center justify-between gap-4 text-sm text-[#4c4546]">
              <span>{item}</span>
              <input className="h-4 w-4 accent-[#99854e]" type="checkbox" {...inputProps} />
            </label>
          );
        })}
      </div>
    </div>
  );
}
