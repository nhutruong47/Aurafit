import { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

export default function Account({ onNavigate, currentUser, onAuthChange }) {
  const [mode, setMode] = useState('login');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const roles = currentUser?.role?.split(',').map((role) => role.trim()).filter(Boolean) || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (isRegister && formData.get('password') !== formData.get('confirmPassword')) {
      setFormError('Mat khau xac nhan chua khop. Vui long kiem tra lai.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const user = isRegister
        ? await registerUser({
            email: formData.get('email'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
          })
        : await loginUser({
            email: formData.get('email'),
            password: formData.get('password'),
          });

      onAuthChange?.(user);
      const roles = user.role?.split(',').map((role) => role.trim()) || [];
      const isAdmin = roles.includes('ADMIN');
      const isStaff = roles.includes('STAFF');
      onNavigate?.(isAdmin ? 'adminDashboard' : isStaff ? 'staffDashboard' : 'home');
    } catch (error) {
      setFormError(error.message || 'Khong the xu ly yeu cau. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser) {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c]">
        <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
          <div className="flex flex-col justify-center md:col-span-5">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">AuraFit Profile</p>
            <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
              Ho so tai khoan
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-[#5f5e5e]">
              Day la thong tin tai khoan dang dang nhap. Khi chua co tai khoan, man hinh nay se hien form dang nhap/dang ky.
            </p>
          </div>

          <div className="flex items-center md:col-span-7">
            <div className="w-full border border-[#cfc4c5] bg-white p-6 md:p-10">
              <div className="mb-8 flex items-start justify-between gap-6 border-b border-[#cfc4c5] pb-8">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl font-semibold uppercase text-white">
                    {(currentUser.fullName || currentUser.email || 'A').charAt(0)}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Dang dang nhap</p>
                    <h2 className="mt-2 font-serif text-3xl italic">{currentUser.fullName || 'AuraFit User'}</h2>
                    <p className="mt-1 text-sm text-[#5f5e5e]">{currentUser.email}</p>
                  </div>
                </div>
                <span className="hidden border border-[#99854e]/30 bg-[#99854e]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#99854e] md:inline-flex">
                  {roles.join(', ') || 'CUSTOMER'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ProfileField label="Email" value={currentUser.email} />
                <ProfileField label="Ho ten" value={currentUser.fullName || 'Chua cap nhat'} />
                <ProfileField label="So dien thoai" value={currentUser.phone || 'Chua cap nhat'} />
                <ProfileField label="Vai tro" value={roles.join(', ') || 'CUSTOMER'} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {roles.includes('ADMIN') && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('adminDashboard')}
                    className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                  >
                    Vao admin dashboard
                  </button>
                )}
                {roles.includes('STAFF') && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('staffDashboard')}
                    className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                  >
                    Vao staff dashboard
                  </button>
                )}
                {!roles.includes('ADMIN') && !roles.includes('STAFF') && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('orders')}
                    className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                  >
                    Xem don hang
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate?.('home')}
                  className="border border-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:border-[#99854e] hover:text-[#99854e]"
                >
                  Ve trang chu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAuthChange?.(null);
                    onNavigate?.('account');
                  }}
                  className="md:col-span-2 border border-[#ba1a1a]/40 px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93000a] transition hover:bg-[#ffdad6]"
                >
                  Dang xuat
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
        <div className="flex flex-col justify-center md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">AuraFit Account</p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
            Your rental wardrobe, one sign in away.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#5f5e5e]">
            Dang nhap de theo doi don thue, quan ly gio hang va lien he AuraFit Admin khi can tu van.
            San pham tren he thong chi do tai khoan ADMIN dang tai va quan ly.
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
                onClick={() => {
                  setMode('login');
                  setFormError('');
                }}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  !isRegister ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                }`}
              >
                Dang nhap
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setFormError('');
                }}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  isRegister ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                }`}
              >
                Dang ky
              </button>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-3xl font-normal italic md:text-4xl">
                {isRegister ? 'Tao tai khoan customer' : 'Chao mung tro lai'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
                {isRegister
                  ? 'Tai khoan moi duoc tao voi role CUSTOMER. Khach hang co the thue do va lien he admin de duoc ho tro.'
                  : 'Admin dang nhap se vao dashboard quan ly san pham. Staff dang nhap se vao man hinh ban giao.'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isRegister && (
                <>
                  <TextField label="Ho ten" name="fullName" placeholder="Nguyen Thanh An" type="text" />
                  <TextField label="So dien thoai" name="phone" placeholder="0901 234 567" type="tel" />
                </>
              )}

              <TextField label="Email" name="email" placeholder="you@aurafit.vn" type="email" />
              <TextField label="Mat khau" name="password" placeholder="********" type="password" />

              {isRegister && (
                <TextField label="Xac nhan mat khau" name="confirmPassword" placeholder="********" type="password" />
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
                {isSubmitting ? 'Dang xu ly...' : isRegister ? 'Tao tai khoan' : 'Dang nhap'}
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('home')}
                  className="w-full border border-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:border-[#99854e] hover:text-[#99854e]"
                >
                  Ve trang chu
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

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

function ProfileField({ label, value }) {
  return (
    <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999999]">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-black">{value}</p>
    </div>
  );
}
