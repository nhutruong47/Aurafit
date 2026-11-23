// Header cua trang Payment voi dieu huong quay lai cac khu vuc chinh.
export default function PaymentHeader({ onNavigate }) {
  return (
    <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#DED2C2] bg-[#F6F1E8] px-5 md:px-20">
      <button onClick={() => onNavigate?.('checkout')} className="group flex items-center gap-2">
        <span className="material-symbols-outlined text-[#6B6259] transition group-hover:text-black">arrow_back</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6B6259]">Quay lại giỏ hàng</span>
      </button>
      <button onClick={() => onNavigate?.('home')} className="font-serif text-3xl uppercase tracking-[0.2em] text-black">
        AuraFit
      </button>
      <div className="hidden items-center gap-3 md:flex">
        <span className="material-symbols-outlined text-[#756536]">lock</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6B6259]">Thanh toán an toàn</span>
      </div>
    </header>
  );
}
