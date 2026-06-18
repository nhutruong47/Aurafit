// Phan dau trang lich su don hang voi thao tac tai lai va quay ve mua sam.
export default function OrdersHeader({ onRefresh, onContinueShopping }) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-4 border-b border-[#cfc4c5] pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Tài khoản của bạn</p>
        <h1 className="font-serif text-4xl font-normal italic md:text-5xl">Lịch sử đơn hàng</h1>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e] transition hover:text-black"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Tải lại
        </button>
        <button
          onClick={onContinueShopping}
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:text-black"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Tiếp tục mua sắm
        </button>
      </div>
    </div>
  );
}
