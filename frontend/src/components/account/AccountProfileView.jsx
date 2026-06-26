// Man hinh ho so tai khoan va cac hanh dong theo vai tro nguoi dung.
import { getUserRoles } from '../../utils/roles';

function ProfileField({ label, value }) {
  return (
    <div className="border border-[#cfc4c5] bg-[#f9f9f9] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999999]">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-black">{value}</p>
    </div>
  );
}

export default function AccountProfileView({ currentUser, onNavigate, onAuthChange }) {
  const roles = getUserRoles(currentUser);

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:px-20 md:py-24">
        <div className="flex flex-col justify-center md:col-span-5">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Hồ sơ AuraFit</p>
          <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[68px]">
            Hồ sơ tài khoản
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#5f5e5e]">
            Đây là thông tin tài khoản đang đăng nhập. Khi chưa có tài khoản, màn hình này sẽ hiển thị form đăng
            nhập/đăng ký.
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
              <ProfileField label="Vai trò" value={roles.join(', ') || 'CUSTOMER'} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {roles.includes('ADMIN') && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('adminDashboard')}
                  className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                >
                  Vào dashboard Admin
                </button>
              )}
              {roles.includes('STAFF') && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('staffDashboard')}
                  className="bg-black px-8 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                >
                  Vào dashboard nhân viên
                </button>
              )}
              {!roles.includes('ADMIN') && !roles.includes('STAFF') && (
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
    </div>
  );
}
