// Form dang nhap va dang ky tai khoan cho nguoi dung.
function TextField({ label, name, placeholder, type }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
      <input
        className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-4 py-4 outline-none transition focus:border-[#99854e]"
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

export default function AccountAuthForm({
  mode,
  formError,
  isSubmitting,
  onModeChange,
  onSubmit,
}) {
  const isRegister = mode === 'register';

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
        <div className="flex flex-col justify-center md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">AuraFit Account</p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
            Your rental wardrobe, one sign in away.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#5f5e5e]">
            Đăng nhập để theo dõi đơn thuê, quản lý giỏ hàng và liên hệ AuraFit Admin khi cần tư vấn.
            Sản phẩm trên hệ thống chỉ do tài khoản ADMIN đăng tải và quản lý.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ['verified_user', 'Secure'],
              ['local_shipping', 'Tracked'],
              ['admin_panel_settings', 'Admin Managed'],
            ].map(([icon, label]) => (
              <div key={label} className="border border-[#cfc4c5] bg-white p-4">
                <span className="material-symbols-outlined text-[#99854e]">{icon}</span>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center md:col-span-7">
          <div className="w-full border border-[#cfc4c5] bg-white p-6 md:p-10">
            <div className="mb-9 grid grid-cols-2 border border-[#cfc4c5] bg-[#f3f3f4] p-1">
              <button
                onClick={() => onModeChange('login')}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  !isRegister ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onModeChange('register')}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  isRegister ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                }`}
              >
                Đăng ký
              </button>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-3xl font-normal italic md:text-4xl">
                {isRegister ? 'Tạo tài khoản customer' : 'Chào mừng trở lại'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                {isRegister
                  ? 'Tài khoản mới được tạo với role CUSTOMER. Khách hàng có thể thuê đồ và liên hệ admin để được hỗ trợ.'
                  : 'Admin đăng nhập sẽ vào dashboard quản lý sản phẩm. Staff đăng nhập sẽ vào màn hình bàn giao.'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              {isRegister && (
                <>
                  <TextField label="Họ tên" name="fullName" placeholder="Nguyễn Thành An" type="text" />
                  <TextField label="Số điện thoại" name="phone" placeholder="0901 234 567" type="tel" />
                </>
              )}

              <TextField label="Email" name="email" placeholder="you@aurafit.vn" type="email" />
              <TextField label="Mật khẩu" name="password" placeholder="********" type="password" />

              {isRegister && (
                <TextField label="Xác nhận mật khẩu" name="confirmPassword" placeholder="********" type="password" />
              )}

              {formError && (
                <div className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                  {formError}
                </div>
              )}

              <button
                disabled={isSubmitting}
                className="w-full bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
              >
                {isSubmitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
