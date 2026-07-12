import { useState } from 'react';
import AdminDrawer from './AdminDrawer';
import { AdminField, Panel } from './AdminDashboardShared';

import Pagination from './Pagination';

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
  onUserSearchChange,
  onCreateStaff,
  page,
  totalPages,
  totalElements,
  setPage,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);

  const handleOpenCreate = () => {
    setStaffForm(emptyStaffForm);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setStaffForm(emptyStaffForm);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setStaffForm((current) => ({ ...current, [name]: value }));
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
      setTimeout(() => setIsDrawerOpen(false), 200);
    }
  };

  return (
    <>
      <Panel
        title="Quản lý nhân viên"
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tạo staff
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block flex-1 max-w-md">
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
        </div>

        {message && <p className="mb-4 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {isLoading && <p className="border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">Đang tải tài khoản...</p>}

        {!isLoading && filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#d7d2c8]">group</span>
            <p className="text-sm text-[#5f5e5e]">Không có tài khoản nào khớp bộ lọc hiện tại.</p>
          </div>
        ) : (
          !isLoading && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    <tr>
                      <th className="px-4 py-3">Tài khoản</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                    {filteredUsers.map((user) => {
                      return (
                        <tr key={user.id} className="transition hover:bg-[#f5f2eb]">
                          <td className="px-4 py-4 font-medium text-black">{user.fullName || 'Chưa cập nhật'}</td>
                          <td className="px-4 py-4 text-[#5f5e5e]">{user.email}</td>
                          <td className="px-4 py-4">
                            <span className="border border-[#d7d2c8] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[#5f5e5e]">
                            <span
                              className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
                                user.status === 'ACTIVE'
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : 'border-red-200 bg-red-50 text-red-700'
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Panel>

      {/* Slide-out Drawer for Create Staff form */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title="Tạo nhân viên mới (STAFF)"
      >
        <form className="space-y-4" onSubmit={handleCreateStaff}>
          <AdminField
            label="Họ tên"
            name="fullName"
            value={staffForm.fullName}
            onChange={handleFieldChange}
          />
          <AdminField
            label="Email"
            name="email"
            type="email"
            value={staffForm.email}
            onChange={handleFieldChange}
          />
          <AdminField
            label="Số điện thoại"
            name="phone"
            value={staffForm.phone}
            onChange={handleFieldChange}
            required={false}
          />

          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
              Trạng thái
            </span>
            <select
              name="status"
              value={staffForm.status}
              onChange={handleFieldChange}
              className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
            >
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="BLOCKED">Khóa (BLOCKED)</option>
            </select>
          </label>

          <AdminField
            label="Mật khẩu tạm thời (tùy chọn)"
            name="temporaryPassword"
            value={staffForm.temporaryPassword}
            onChange={handleFieldChange}
            required={false}
          />
          <p className="text-xs text-[#5f5e5e] italic -mt-2">Nếu để trống, mật khẩu mặc định sẽ là AuraFit123</p>

          <div className="flex gap-3 pt-4">
            <button
              disabled={isCreatingStaff}
              className="flex-1 bg-black py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
            >
              {isCreatingStaff ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="border border-[#d7d2c8] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Hủy
            </button>
          </div>
        </form>
      </AdminDrawer>
    </>
  );
}
