// Hero section xac nhan dat hang thanh cong.
import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderSuccessHero({ orderId, status, totalLabel, onContinue }) {
  return (
    <section className="relative flex h-[614px] w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          className="h-full w-full animate-[subtleZoom_20s_linear_infinite_alternate] object-cover opacity-20 grayscale"
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85"
          alt="Xưởng thời trang tối giản"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f9f9f9]/0 to-[#f9f9f9]" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-[#99854e]">
            <span className="material-symbols-outlined text-4xl text-[#99854e]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        </div>
        <h1 className="mb-4 font-serif text-[64px] font-normal leading-tight">Đặt hàng thành công</h1>
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">
          {orderId ? `Đơn hàng #ARF${String(orderId).padStart(4, '0')}` : 'Đơn hàng AuraFit'}
        </p>
        {status && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
            Trạng thái: {status}
          </p>
        )}
        {totalLabel && (
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
            Tổng thanh toán: {formatCurrency(totalLabel)}
          </p>
        )}
        <p className="mx-auto mt-6 max-w-lg text-lg font-light leading-8 text-[#5f5e5e]">
          Cảm ơn bạn đã chọn AuraFit. Đội ngũ của chúng tôi sẽ chuẩn bị đơn hàng và sớm liên hệ xác nhận thanh
          toán.
        </p>
        {onContinue && (
          <button
            onClick={onContinue}
            className="mt-10 bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
          >
            Tiếp tục mua sắm
          </button>
        )}
      </div>
    </section>
  );
}
