// Sidebar bo loc va thong diep uu dai nhom cho Yearbook.
import CostumeCheckboxFilterGroup from '../costume/CostumeCheckboxFilterGroup';

export default function YearbookSidebar({ styles, materials, genders }) {
  return (
    <div className="sticky top-28 space-y-9">
      <CostumeCheckboxFilterGroup title="Phong cách" items={styles} />
      <CostumeCheckboxFilterGroup title="Chất liệu" items={materials} />
      <div className="border border-[#cfc4c5] bg-[#f2f0eb] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Ưu đãi nhóm</p>
        <p className="mt-3 font-serif text-3xl italic leading-tight">15% cho lớp từ 8 outfit</p>
        <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
          Team AuraFit hỗ trợ phối màu, size run và lịch giao đồ theo buổi chụp.
        </p>
      </div>
      <CostumeCheckboxFilterGroup title="Giới tính" items={genders} />
    </div>
  );
}
