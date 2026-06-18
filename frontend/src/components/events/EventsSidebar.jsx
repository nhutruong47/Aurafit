// Sidebar bo loc va thong diep event bundle cho trang Events.
import CostumeCheckboxFilterGroup from '../costume/CostumeCheckboxFilterGroup';

export default function EventsSidebar({ occasions, silhouettes, rentalWindows }) {
  return (
    <div className="sticky top-28 space-y-8">
      <CostumeCheckboxFilterGroup title="Dịp thuê" items={occasions} />
      <CostumeCheckboxFilterGroup title="Kiểu dáng" items={silhouettes} />
      <CostumeCheckboxFilterGroup title="Thời gian thuê" items={rentalWindows} />
      <div className="border border-[#cfc4c5] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Event bundle</p>
        <p className="mt-3 font-serif text-3xl italic leading-tight">Thêm phụ kiện để khóa outfit.</p>
        <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">
          Khi thuê một món, giỏ hàng sẽ gợi ý túi, giày, trang sức hoặc khăn phù hợp.
        </p>
      </div>
    </div>
  );
}
