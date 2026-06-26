import { useEffect, useState } from 'react';
import { requestRegistrationOtp } from '../../services/authService';

function TextField({ label, name, placeholder, type = 'text', value, onChange, required = true, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
      <input
        className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-4 py-4 outline-none transition focus:border-[#99854e]"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
    </label>
  );
}

const OTP_TTL_SECONDS = 300;

const emptyForm = {
  email: '',
  fullName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  otpCode: '',
};

export default function AccountAuthForm({ mode, formError, isSubmitting, onModeChange, onSubmit }) {
  const isRegister = mode === 'register';
  const [stage, setStage] = useState('details');
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (otpCountdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setOtpCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCountdown]);

  useEffect(() => {
    if (mode !== 'register') {
      setStage('details');
      setForm(emptyForm);
      setLocalError('');
      setInfoMessage('');
      setOtpCountdown(0);
    }
  }, [mode]);

  const updateField = (field) => (event) => {
    let nextValue = event.target.value;
    if (field === 'otpCode') {
      nextValue = nextValue.replace(/\D/g, '').slice(0, 6);
    } else if (field === 'phone') {
      nextValue = nextValue.replace(/\D/g, '').slice(0, 11);
    }
    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setLocalError('');
    setInfoMessage('');

    if (form.password !== form.confirmPassword) {
      setLocalError('Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (!form.email || !form.fullName || !form.phone || !form.password) {
      setLocalError('Vui lòng điền đầy đủ họ tên, số điện thoại, email và mật khẩu.');
      return;
    }

    try {
      const response = await requestRegistrationOtp({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        password: form.password,
      });
      setStage('verify-otp');
      setOtpCountdown(OTP_TTL_SECONDS);
      const fallbackMsg = `Đã đăng ký tạm. Mã OTP đã gửi tới ${form.email}. Vui lòng kiểm tra hộp thư và nhập mã để kích hoạt tài khoản.`;
      setInfoMessage(response?.message || fallbackMsg);
    } catch (err) {
      setLocalError(err.message || 'Không thể đăng ký và gửi mã OTP. Vui lòng thử lại.');
    }
  };

  const handleResendOtp = async () => {
    if (!form.email || otpCountdown > 0) return;
    setLocalError('');
    setInfoMessage('');

    try {
      await requestRegistrationOtp({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        password: form.password,
      });
      setOtpCountdown(OTP_TTL_SECONDS);
      setInfoMessage('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
    } catch (err) {
      setLocalError(err.message || 'Không thể gửi lại mã OTP.');
    }
  };

  const handleVerifyAndRegister = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!form.otpCode || form.otpCode.length !== 6) {
      setLocalError('Vui lòng nhập đủ 6 chữ số của mã OTP.');
      return;
    }

    await onSubmit({
      email: form.email,
      otpCode: form.otpCode,
    });
  };

  const displayError = formError || localError;

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
                type="button"
                onClick={() => {
                  onModeChange('login');
                  setLocalError('');
                  setInfoMessage('');
                }}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  !isRegister ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange('register');
                  setLocalError('');
                  setInfoMessage('');
                }}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  isRegister ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                }`}
              >
                Đăng ký
              </button>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-3xl font-normal italic md:text-4xl">
                {isRegister
                  ? stage === 'verify-otp'
                    ? 'Xác thực OTP để hoàn tất đăng ký'
                    : 'Đăng ký tài khoản'
                  : 'Chào mừng trở lại'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                {isRegister
                  ? stage === 'verify-otp'
                    ? `Mã xác thực đã gửi tới ${form.email}. Nhập mã OTP để kích hoạt tài khoản của bạn.`
                    : 'Điền đầy đủ thông tin rồi nhấn Đăng ký. Hệ thống sẽ gửi mã OTP xác thực email Gmail trước khi hoàn tất đăng ký.'
                  : 'Admin đăng nhập sẽ vào dashboard quản lý sản phẩm. Staff đăng nhập sẽ vào màn hình bàn giao.'}
              </p>
            </div>

            {!isRegister ? (
              <form className="space-y-5" onSubmit={onSubmit}>
                <TextField label="Email" name="email" type="email" placeholder="you@aurafit.vn" autoComplete="email" />
                <TextField label="Mật khẩu" name="password" type="password" placeholder="********" autoComplete="current-password" />

                {displayError && (
                  <div className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                    {displayError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </form>
            ) : stage === 'details' ? (
              <form className="space-y-5" onSubmit={handleSendOtp}>
                <TextField
                  label="Họ tên"
                  name="fullName"
                  placeholder="Nguyễn Thành An"
                  value={form.fullName}
                  onChange={updateField('fullName')}
                  autoComplete="name"
                />
                <TextField
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  placeholder="0901 234 567"
                  value={form.phone}
                  onChange={updateField('phone')}
                  autoComplete="tel"
                />
                <TextField
                  label="Email Gmail"
                  name="email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={form.email}
                  onChange={updateField('email')}
                  autoComplete="email"
                />
                <TextField
                  label="Mật khẩu"
                  name="password"
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onChange={updateField('password')}
                  autoComplete="new-password"
                />
                <TextField
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={form.confirmPassword}
                  onChange={updateField('confirmPassword')}
                  autoComplete="new-password"
                />

                {displayError && (
                  <div className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                    {displayError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
                >
                  {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyAndRegister}>
                <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-4 text-sm leading-6 text-[#5f5e5e]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#99854e]">Thông tin đã đăng ký</p>
                  <p className="mt-2"><strong>Họ tên:</strong> {form.fullName}</p>
                  <p><strong>Số điện thoại:</strong> {form.phone}</p>
                  <p><strong>Email:</strong> {form.email}</p>
                </div>

                <div>
                  <TextField
                    label="Mã OTP (6 chữ số)"
                    name="otpCode"
                    placeholder="123456"
                    value={form.otpCode}
                    onChange={updateField('otpCode')}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#5f5e5e]">
                    <span>
                      {otpCountdown > 0
                        ? `Mã hết hạn sau ${Math.floor(otpCountdown / 60)}:${String(otpCountdown % 60).padStart(2, '0')}`
                        : 'Mã đã hết hạn, vui lòng gửi lại.'}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpCountdown > 0}
                      className="font-semibold uppercase tracking-[0.16em] text-[#99854e] transition hover:text-black disabled:cursor-not-allowed disabled:text-[#999999]"
                    >
                      Gửi lại mã
                    </button>
                  </div>
                </div>

                {infoMessage && (
                  <div className="border border-[#99854e]/30 bg-[#99854e]/10 px-4 py-3 text-sm text-[#99854e]">
                    {infoMessage}
                  </div>
                )}

                {displayError && (
                  <div className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                    {displayError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác thực và tạo tài khoản'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStage('details');
                    setLocalError('');
                    setInfoMessage('');
                  }}
                  className="block w-full text-center text-[11px] uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:text-black"
                >
                  ← Chỉnh sửa thông tin
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
