import { useEffect, useState } from 'react';
import { createLessorApplication, fetchUserLessorApplications } from '../services/api';

const emptyForm = {
  shopName: '',
  shopAddress: '',
  citizenIdImageUrl: '',
  bankAccountNumber: '',
};

export default function BecomeLessor({ currentUser, onNavigate }) {
  const [form, setForm] = useState(emptyForm);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const latestApplication = applications[0];
  const isApproved = currentUser?.role?.split(',').some((role) => role.trim() === 'LESSOR');
  const hasPending = latestApplication?.status === 'PENDING';

  useEffect(() => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    fetchUserLessorApplications(currentUser.id)
      .then(setApplications)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [currentUser?.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setError('Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi mở shop.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const application = await createLessorApplication({
        userId: currentUser.id,
        ...form,
      });
      setApplications((currentApplications) => [application, ...currentApplications]);
      setForm(emptyForm);
      setMessage('Hồ sơ mở shop đã được gửi. Trạng thái hiện tại: PENDING.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c]">
        <section className="mx-auto min-h-[calc(100dvh-80px)] max-w-[920px] px-5 py-20 md:px-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Open a Shop</p>
          <h1 className="font-serif text-[46px] font-normal italic leading-tight md:text-[70px]">
            Đăng ký tài khoản trước khi mở shop.
          </h1>
          <button
            onClick={() => onNavigate?.('account')}
            className="mt-9 bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
          >
            Đăng nhập / đăng ký
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
        <div className="md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Become a Lessor</p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
            Mở shop cho thuê trang phục trên AuraFit.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#5f5e5e]">
            Gửi thông tin shop, giấy tờ xác minh và tài khoản nhận tiền. Admin duyệt hồ sơ trước khi tài khoản có thêm
            role LESSOR.
          </p>

          <div className="mt-10 border border-[#cfc4c5] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">Tài khoản</p>
            <p className="mt-3 font-serif text-2xl italic">{currentUser.fullName || currentUser.email}</p>
            <p className="mt-2 text-sm text-[#5f5e5e]">Role hiện tại: {currentUser.role}</p>
          </div>

          {latestApplication && (
            <div className="mt-5 border border-[#cfc4c5] bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">Hồ sơ gần nhất</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <p className="font-serif text-2xl italic">{latestApplication.shopName}</p>
                <StatusPill status={latestApplication.status} />
              </div>
              {latestApplication.rejectReason && (
                <p className="mt-3 text-sm leading-6 text-[#93000a]">{latestApplication.rejectReason}</p>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-7">
          <form onSubmit={handleSubmit} className="border border-[#cfc4c5] bg-white p-6 md:p-10">
            <div className="mb-8">
              <h2 className="font-serif text-3xl font-normal italic md:text-4xl">Thông tin mở shop</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                Hồ sơ mới sẽ ở trạng thái PENDING cho đến khi admin duyệt.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Tên shop" name="shopName" value={form.shopName} onChange={handleChange} />
              <TextField
                label="Số tài khoản ngân hàng"
                name="bankAccountNumber"
                value={form.bankAccountNumber}
                onChange={handleChange}
              />
              <TextField
                label="Địa chỉ shop"
                name="shopAddress"
                value={form.shopAddress}
                onChange={handleChange}
                className="md:col-span-2"
              />
              <TextField
                label="Ảnh CCCD"
                name="citizenIdImageUrl"
                value={form.citizenIdImageUrl}
                onChange={handleChange}
                placeholder="https://... hoặc tên file ảnh"
                className="md:col-span-2"
              />
            </div>

            {error && (
              <div className="mt-6 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-6 border border-[#4c7a56]/30 bg-[#e8f4ea] px-4 py-3 text-sm font-medium text-[#245131]">
                {message}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                disabled={isSubmitting || isLoading || hasPending || isApproved}
                className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
              >
                {hasPending ? 'Đang chờ duyệt' : isApproved ? 'Đã là chủ shop' : isSubmitting ? 'Đang gửi...' : 'Gửi hồ sơ'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('sellerDashboard')}
                className="border border-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-[#99854e] hover:text-[#99854e]"
              >
                Xem kênh shop
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function TextField({ label, name, value, onChange, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
      <input
        className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-4 py-4 outline-none transition focus:border-[#99854e]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type="text"
        value={value}
      />
    </label>
  );
}

function StatusPill({ status }) {
  const tone =
    status === 'APPROVED'
      ? 'bg-green-100 text-green-700'
      : status === 'REJECTED'
        ? 'bg-red-100 text-red-700'
        : 'bg-[#f8f4e8] text-[#806f3d]';

  return <span className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone}`}>{status}</span>;
}
