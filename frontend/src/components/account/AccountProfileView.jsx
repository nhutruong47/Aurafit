// Man hinh ho so tai khoan va cac hanh dong theo vai tro nguoi dung.
import { useState, useEffect } from 'react';
import { getUserRoles } from '../../utils/roles';
import { updateProfile, changePassword } from '../../services/userService';
import { useToastStore } from '../../store/useToastStore';
import authNotify from '../../utils/authNotify';
import SearchableSelect from '../common/SearchableSelect';
import TryOnHistorySection from './TryOnHistorySection';

function ProfileField({ label, value }) {
  return (
    <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999999]">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-black">{value}</p>
    </div>
  );
}

function EditProfileModal({ currentUser, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: currentUser.fullName || '',
    phone: currentUser.phone || '',
    address: currentUser.address || '',
    bankName: currentUser.bankName || '',
    bankAccountNumber: currentUser.bankAccountNumber || '',
    bankAccountName: currentUser.bankAccountName || '',
  });
  const [banks, setBanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setBanks(data.data);
        }
      })
      .catch(err => console.error('Lỗi khi tải danh sách ngân hàng:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Quý khách vui lòng cung cấp họ và tên.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await updateProfile(form);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Hệ thống gặp sự cố khi cập nhật hồ sơ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 space-y-5">
        <h2 className="font-serif text-2xl italic">Chỉnh sửa hồ sơ</h2>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Họ tên *</label>
          <input type="text" value={form.fullName} onChange={(e) => setForm(f => ({...f, fullName: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Số điện thoại</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Địa chỉ</label>
          <input type="text" value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" placeholder="Số nhà, đường, phường, quận, TP" />
        </div>
        
        <div className="border-t pt-4 mt-2">
          <h3 className="font-serif italic text-lg mb-4 text-[#99854e]">Thông tin hoàn cọc (Tùy chọn)</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Ngân hàng</label>
              <SearchableSelect
                value={form.bankName}
                onChange={(val) => setForm(f => ({...f, bankName: val}))}
                options={banks.map(bank => ({ value: bank.shortName, label: `${bank.shortName} - ${bank.name}` }))}
                placeholder="-- Chọn ngân hàng --"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Số tài khoản</label>
              <input type="text" value={form.bankAccountNumber} onChange={(e) => setForm(f => ({...f, bankAccountNumber: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Chủ tài khoản</label>
              <input type="text" value={form.bankAccountName} onChange={(e) => setForm(f => ({...f, bankAccountName: e.target.value.toUpperCase()}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none uppercase placeholder:normal-case" placeholder="NGUYEN VAN A" />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-black py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:opacity-50">
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 border border-black py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-[#99854e] hover:text-[#99854e]">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) { setError('Mật khẩu bảo mật cần chứa ít nhất 6 ký tự.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Mật khẩu xác nhận không trùng khớp.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      addToast('Đổi mật khẩu thành công!');
      onClose();
    } catch (err) {
      setError(err.message || 'Hệ thống gặp sự cố khi thay đổi mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 space-y-5">
        <h2 className="font-serif text-2xl italic">Đổi mật khẩu</h2>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Mật khẩu cũ *</label>
          <input type="password" value={form.oldPassword} onChange={(e) => setForm(f => ({...f, oldPassword: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Mật khẩu mới *</label>
          <input type="password" value={form.newPassword} onChange={(e) => setForm(f => ({...f, newPassword: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Xác nhận mật khẩu mới *</label>
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm(f => ({...f, confirmPassword: e.target.value}))} className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-black py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e] disabled:opacity-50">
            {isSubmitting ? 'Đang xử lý yêu cầu...' : 'Đổi mật khẩu'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 border border-black py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-[#99854e] hover:text-[#99854e]">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AccountProfileView({ currentUser, onNavigate, onAuthChange }) {
  const roles = getUserRoles(currentUser);
  const isAdmin = roles.includes('ADMIN');
  const isStaff = roles.includes('STAFF') || isAdmin;
  const addToast = useToastStore((state) => state.addToast);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleProfileSaved = (updatedUser) => {
    const merged = { ...currentUser, ...updatedUser };
    onAuthChange?.(merged);
    addToast('Hồ sơ đã được cập nhật!');
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
        <div className="flex flex-col justify-center md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Hồ sơ AuraFit</p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
            Hồ sơ tài khoản
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#5f5e5e]">
            Đây là thông tin tài khoản đang đăng nhập. Bạn có thể chỉnh sửa thông tin cá nhân hoặc đổi mật khẩu.
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Đang đăng nhập</p>
                  <h2 className="mt-2 font-serif text-3xl italic">{currentUser.fullName || 'Người dùng AuraFit'}</h2>
                  <p className="mt-1 text-sm text-[#5f5e5e]">{currentUser.email}</p>
                </div>
              </div>
              <span className="hidden border border-[#99854e]/30 bg-[#99854e]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#99854e] md:inline-flex">
                {roles.join(', ') || 'CUSTOMER'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileField label="Email" value={currentUser.email} />
              <ProfileField label="Họ tên" value={currentUser.fullName || 'Chưa cập nhật'} />
              <ProfileField label="Số điện thoại" value={currentUser.phone || 'Chưa cập nhật'} />
              <ProfileField label="Địa chỉ" value={currentUser.address || 'Chưa cập nhật'} />
              <ProfileField label="Vai trò" value={roles.join(', ') || 'CUSTOMER'} />
              <ProfileField label="Ngân hàng hoàn cọc" value={currentUser.bankName ? `${currentUser.bankName} - ${currentUser.bankAccountNumber} (${currentUser.bankAccountName})` : 'Chưa cập nhật'} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="bg-[#99854e] px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7a6a3e]"
              >
                Chỉnh sửa hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="border border-[#99854e] px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e] transition hover:bg-[#99854e]/10"
              >
                Đổi mật khẩu
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('adminDashboard')}
                  className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                >
                  Vào dashboard Admin
                </button>
              )}
              {isStaff && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('staffDashboard')}
                  className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                >
                  Vào dashboard nhân viên
                </button>
              )}
              {(!isStaff || isAdmin) && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('orders')}
                  className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                >
                  Xem đơn hàng
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate?.('home')}
                className="border border-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:border-[#99854e] hover:text-[#99854e]"
              >
                Về trang chủ
              </button>
              <button
                type="button"
                onClick={() => {
                  authNotify.logoutSuccess(currentUser);
                  onAuthChange?.(null);
                  onNavigate?.('account');
                }}
                className="border border-[#ba1a1a]/40 px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93000a] transition hover:bg-[#ffdad6] md:col-span-2"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </section>

      <TryOnHistorySection />

      {showEditProfile && (
        <EditProfileModal
          currentUser={currentUser}
          onClose={() => setShowEditProfile(false)}
          onSaved={handleProfileSaved}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
