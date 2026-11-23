// Nhom checkbox filter dung chung cho cac trang costume.
export default function CostumeCheckboxFilterGroup({
  title,
  items,
  selectedItems,
  onToggle,
}) {
  const isControlled = Array.isArray(selectedItems) && typeof onToggle === 'function';

  return (
    <div className="border-b border-[#DED2C2] pb-7">
      <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6B6259]">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const isObject = typeof item === 'object' && item !== null;
          const id = isObject ? item.id : item;
          const label = isObject ? item.label : item;
          
          const inputProps = isControlled
            ? {
                checked: selectedItems.includes(id),
                onChange: () => onToggle(id),
              }
            : {};

          return (
            <label key={id} className="flex cursor-pointer items-center justify-between gap-4 text-sm text-[#4c4546]">
              <span>{label}</span>
              <input className="h-4 w-4 accent-[#A98A55]" type="checkbox" {...inputProps} />
            </label>
          );
        })}
      </div>
    </div>
  );
}
