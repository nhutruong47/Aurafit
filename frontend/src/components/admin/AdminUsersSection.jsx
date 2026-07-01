import { useState } from 'react';
import { Panel } from './AdminDashboardShared';

const emptyStaffForm = {
  fullName: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
  temporaryPassword: '',
};

export default function AdminUsersSection({
  filteredUsers,
  userSearch,
  message,
  error,
  isLoading,
  isCreatingStaff,
  updatingUserId,
  onUserSearchChange,
  onSellerPermissionChange,
  onCreateStaff,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);

  const handleFieldChange = (field) => (event) => {
    setStaffForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    if (!staffForm.fullName.trim() || !staffForm.email.trim()) {
      return;
    }

    const created = await onCreateStaff?.({
      fullName: staffForm.fullName.trim(),
      email: staffForm.email.trim(),
      phone: staffForm.phone.trim(),
      status: staffForm.status,
      temporaryPassword: staffForm.temporaryPassword.trim(),
    });

    if (created) {
      setStaffForm(emptyStaffForm);
      setIsFormOpen(false);
    }
  };

  return (
    <Panel title="Quản lý nhân viên" action={`${filteredUsers.length} tài khoản`}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative block flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
            search
          </span>
          <input
            value={userSearch}
            onChange={(event) => onUserSearchChange(event.target.value)}
            placeholder="Tìm theo tên, email hoặc vai trò..."
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
          />
        </label>
        <button
          type="button"
          onClick={() => setIsFormOpen((current) => !current)}
          className="bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
        >
          {isFormOpen ? 'Đóng' : 'Tạo staff'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreateStaff} className="mb-5 border border-[#d7d2c8] bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
                Họ tên
              </span>
              <input
                required
                value={staffForm.fullName}
                onChange={handleFieldChange('fullName')}
                className="w-full border border-[#d7d2c8] px-3 py-2 text-sm outline-none focus:border-[#7f7041]"
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
                Email
              </span>
              <input
                required
                type="email"
                value={staffForm.email}
                onChange={handleFieldChange('email')}
                className="w-full border border-[#d7d2c8] px-3 py-2 text-sm outline-none focus:border-[#7f7041]"
                placeholder="staff@aurafit.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
                Số điện thoại
              </span>
              <input
                value={staffForm.phone}
                onChange={handleFieldChange('phone')}
                className="w-full border border-[#d7d2c8] px-3 py-2 text-sm outline-none focus:border-[#7f7041]"
                placeholder="0909 123 456"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
                Trạng thái
              </span>
              <select
                value={staffForm.status}
                onChange={handleFieldChange('status')}
                className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7f7041]"
              >
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Inactive</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
              Mật khẩu tạm thời
            </span>
            <input
              value={staffForm.temporaryPassword}
              onChange={handleFieldChange('temporaryPassword')}
              className="w-full border border-[#d7d2c8] px-3 py-2 text-sm outline-none focus:border-[#7f7041]"
              placeholder="Để trống để dùng mật khẩu mặc định"
            />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#5f5e5e]">Vai trò sẽ tự động là STAFF.</p>
            <button
              type="submit"
              disabled={isCreatingStaff}
              className="bg-[#111111] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingStaff ? 'Đang tạo...' : 'Lưu staff'}
            </button>
          </div>
        </form>
      )}

      {message && <p className="mb-4 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {isLoading && <p className="border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">Đang tải tài khoản...</p>}

      {!isLoading && (
        <div className="overflow-hidden border border-[#ebe7df]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              <tr>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Quyền cho thuê</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
              {filteredUsers.map((user) => {
                const canToggleSeller = user.role === 'CUSTOMER' || user.role === 'SELLER';
                const isSeller = user.role === 'SELLER';
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-4 font-medium text-black">{user.fullName || 'Chưa cập nhật'}</td>
                    <td className="px-4 py-4 text-[#5f5e5e]">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className="border border-[#d7d2c8] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#5f5e5e]">{user.status}</td>
                    <td className="px-4 py-4 text-right">
                      {canToggleSeller ? (
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => onSellerPermissionChange(user, !isSeller)}
                          className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSeller
                              ? 'border border-[#ba1a1a]/40 text-[#93000a] hover:bg-[#ffdad6]'
                              : 'bg-black text-white hover:bg-[#7f7041]'
                          }`}
                        >
                          {updatingUserId === user.id ? 'Đang lưu...' : isSeller ? 'Thu hồi' : 'Cấp quyền'}
                        </button>
                      ) : (
                        <span className="text-xs text-[#999999]">Không áp dụng</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && filteredUsers.length === 0 && (
        <p className="mt-4 border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">
          Không có tài khoản nào khớp bộ lọc hiện tại.
        </p>
      )}
    </Panel>
  );
}
