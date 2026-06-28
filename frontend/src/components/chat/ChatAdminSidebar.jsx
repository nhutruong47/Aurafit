import { adminContact } from '../../utils/shopMock';

function StatusChip({ children }) {
  return (
    <span className="w-fit bg-[#99854e]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#99854e]">
      {children}
    </span>
  );
}

export default function ChatAdminSidebar({ products }) {
  return (
    <aside className="flex h-auto w-full flex-shrink-0 flex-col border-b border-[#cfc4c5] bg-white md:h-full md:w-[380px] md:border-b-0 md:border-r">
      <div className="border-b border-[#cfc4c5] p-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">
          Chatbot AuraFit
        </p>
        <h1 className="font-serif text-3xl font-normal">AuraFit Chatbot</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
          Chatbot tự động dựa trên catalog thật để gợi ý costume, giá thuê và lý do phù hợp, không tự tạo sản phẩm ngoài database.
        </p>
      </div>

      <button className="grid w-full grid-cols-[64px_1fr] gap-4 bg-[#f3f3f4] p-5 text-left">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-[#cfc4c5] bg-[#eeeeee]">
          <img alt={adminContact.name} className="h-full w-full object-cover" src={adminContact.avatar} />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h2 className="truncate text-base font-bold">{adminContact.name}</h2>
            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999999]">
              Đang sẵn sàng
            </span>
          </div>
          <StatusChip>{products.length || 1} ngữ cảnh tư vấn</StatusChip>
          <p className="mt-2 truncate text-sm text-[#5f5e5e]">Chỉ đề xuất từ sản phẩm đang có trong hệ thống</p>
        </div>
      </button>
    </aside>
  );
}
