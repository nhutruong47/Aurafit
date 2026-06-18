// Khu vuc thu thap email dang ky nhan tin tu AuraFit.
export default function HomeInsiderSection({
  email,
  isSubscribed,
  onEmailChange,
  onSubscribe,
  onCopyVoucher,
  onScrollTop,
}) {
  return (
    <section className="bg-[#f7f7f7] px-5 pb-24 md:px-20 md:pb-[120px]">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden bg-black px-6 py-24 text-center md:py-36">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20" />
        <div className="relative z-10">
          <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#99854e]">The Insider Club</p>
          <h2 className="mb-10 font-serif text-4xl font-normal italic text-white md:text-6xl">
            Gia nhập cộng đồng <br /> AuraFit
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-lg font-light italic leading-8 text-white/70">
            Nhận đặc quyền ưu đãi 20% cho đơn hàng đầu tiên và truy cập sớm vào các bộ sưu tập giới hạn.
          </p>
          {isSubscribed ? (
            <div className="mx-auto max-w-xl border border-[#99854e] bg-black px-8 py-10 text-center text-white shadow-2xl animate-[fadeIn_0.5s_ease-out]">
              <span className="material-symbols-outlined mb-4 text-4xl text-[#99854e]">redeem</span>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">
                Đăng ký thành công!
              </p>
              <p className="mb-6 text-sm italic text-white/80">
                Chào mừng bạn đến với Insider Club. Như một lời cảm ơn, đây là voucher giảm giá 20% cho đơn hàng đầu tiên của bạn:
              </p>
              <div className="mx-auto mb-6 flex max-w-sm items-center justify-between border border-dashed border-[#cfc4c5]/40 bg-[#1a1c1c] p-4">
                <span className="font-mono text-xl font-bold tracking-widest text-white">AURA20WELCOME</span>
                <button
                  onClick={onCopyVoucher}
                  className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#99854e] transition hover:text-white"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Copy
                </button>
              </div>
              <button
                onClick={onScrollTop}
                className="bg-[#99854e] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
              >
                Bắt đầu thuê nghiệm
              </button>
            </div>
          ) : (
            <form onSubmit={onSubscribe} className="mx-auto flex max-w-xl flex-col border border-white/20 sm:flex-row">
              <input
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="flex-1 border-none bg-transparent px-7 py-5 text-white placeholder-white/40 outline-none"
                placeholder="Email của bạn..."
                type="email"
              />
              <button
                type="submit"
                className="bg-white px-10 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#99854e] hover:text-white"
              >
                Đăng ký ngay
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
