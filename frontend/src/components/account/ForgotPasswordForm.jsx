import { useEffect, useState } from 'react';
import { requestPasswordResetOtp, resetPassword } from '../../services/authService';
import { useToastStore } from '../../store/useToastStore';
import AlertMessage from '../ui/AlertMessage';

const OTP_TTL_SECONDS = 300;

function Field({ label, name, type = 'text', value, onChange, placeholder, autoComplete, minLength }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6259]">{label}</span>
      <input
        className="w-full border border-[#DED2C2] bg-[#F6F1E8] px-4 py-4 outline-none transition focus:border-[#A98A55]"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
    </label>
  );
}

export default function ForgotPasswordForm({ onBack }) {
  const addToast = useToastStore((state) => state.addToast);
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const sendOtp = async () => {
    setError('');
    setInfo('');
    setIsSubmitting(true);
    try {
      await requestPasswordResetOtp({ email: email.trim() });
      setStage('reset');
      setCountdown(OTP_TTL_SECONDS);
      setInfo(`Nếu ${email.trim()} tồn tại trong hệ thống, mã xác thực đã được gửi. Mã có hiệu lực 5 phút.`);
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi mã đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }
    await sendOtp();
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otpCode)) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ email: email.trim(), otpCode, newPassword });
      addToast('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      onBack?.();
    } catch (requestError) {
      setError(requestError.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F6F1E8] text-[#211E1B]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
        <div className="flex flex-col justify-center md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756536]">Tài khoản AuraFit</p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
            Khôi phục quyền truy cập.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#6B6259]">
            Nhập email đã đăng ký để nhận mã xác thực, sau đó đặt mật khẩu mới.
          </p>
        </div>

        <div className="flex items-center md:col-span-7">
          <div className="w-full border border-[#DED2C2] bg-white p-6 md:p-10">
            <h2 className="font-serif text-3xl font-normal italic md:text-4xl">
              {stage === 'email' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6B6259]">
              {stage === 'email'
                ? 'Chúng tôi sẽ gửi mã OTP 6 chữ số đến email của bạn.'
                : 'Nhập mã OTP đã nhận và mật khẩu mới cho tài khoản.'}
            </p>

            <form className="mt-8 space-y-5" onSubmit={stage === 'email' ? handleRequest : handleReset}>
              {stage === 'email' ? (
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@aurafit.vn"
                  autoComplete="email"
                />
              ) : (
                <>
                  <Field
                    label="Mã OTP"
                    name="otpCode"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                  />
                  <Field
                    label="Mật khẩu mới"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <Field
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    minLength={8}
                  />
                </>
              )}

              {info && !error && (
                <p className="border border-[#D6B87E] bg-[#fbf7e8] px-4 py-3 text-sm text-[#756536]">{info}</p>
              )}
              {error && <AlertMessage text={error} />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#756536] disabled:cursor-not-allowed disabled:bg-[#777777]"
              >
                {isSubmitting
                  ? 'Đang xử lý...'
                  : stage === 'email'
                    ? 'Gửi mã xác thực'
                    : 'Đặt lại mật khẩu'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              {stage === 'reset' && (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={countdown > 0 || isSubmitting}
                  className="text-[#756536] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[#6B6259] disabled:no-underline"
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                </button>
              )}
              <button
                type="button"
                onClick={onBack}
                className="ml-auto text-[#6B6259] underline-offset-4 hover:text-black hover:underline"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
