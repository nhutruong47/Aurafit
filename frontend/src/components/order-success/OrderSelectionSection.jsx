// Danh sach san pham da duoc xac nhan trong trang order success.
function IconText({ icon, text, accent = false }) {
  return (
    <div className={`flex items-center gap-2 ${accent ? 'text-[#99854e]' : ''}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">{text}</span>
    </div>
  );
}

function ConfirmedItem({ item }) {
  return (
    <div className="group flex flex-col gap-8 md:flex-row">
      <div className="h-64 w-full overflow-hidden bg-[#f7f7f7] md:w-48">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-col justify-between py-2">
        <div>
          <h3 className="mb-2 font-serif text-3xl font-normal">{item.name}</h3>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{item.size}</p>
        </div>
        <div className="space-y-2">
          <IconText icon="calendar_today" text={`Thời gian thuê: ${item.rental || 'Đang cập nhật'}`} />
          <IconText icon="assignment_return" text="Hoàn trả đúng hẹn theo hướng dẫn" accent />
        </div>
      </div>
    </div>
  );
}

export default function OrderSelectionSection({ items }) {
  return (
    <div className="space-y-12 md:col-span-7">
      <div className="border-b border-[#cfc4c5] pb-4">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em]">Sản phẩm đã chọn</h2>
      </div>
      <div className="space-y-16">
        {items.map((item) => (
          <ConfirmedItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}
