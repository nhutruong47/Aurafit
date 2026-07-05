import CostumeCheckboxFilterGroup from '../costume/CostumeCheckboxFilterGroup';

export default function YearbookSidebar({
  categories,
  selectedCategoryPath,
  onToggleCategory,
  onClearFilters,
}) {
  return (
    <div className="sticky top-28 space-y-9">
      <CostumeCheckboxFilterGroup
        title="Danh mục kỷ yếu"
        items={categories}
        selectedItems={selectedCategoryPath ? [selectedCategoryPath] : []}
        onToggle={onToggleCategory}
      />
      <div className="border border-[#cfc4c5] bg-[#f2f0eb] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Ưu đãi nhóm</p>
        <p className="mt-3 font-serif text-3xl italic leading-tight">Giảm 15% cho lớp từ 8 outfit</p>
        <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
          AuraFit hỗ trợ phối màu, chọn size và sắp xếp lịch giao nhận để cả nhóm chuẩn bị nhẹ nhàng hơn.
        </p>
      </div>
      <button
        onClick={onClearFilters}
        className="w-full border border-black bg-white py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
