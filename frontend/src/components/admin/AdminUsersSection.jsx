import { Panel } from './AdminDashboardShared';

export default function AdminUsersSection({
  filteredUsers,
  userSearch,
  message,
  error,
  isLoading,
  updatingUserId,
  onUserSearchChange,
  onSellerPermissionChange,
}) {
  return (
    <Panel title="Tài khoản bán" action={`${filteredUsers.length} tài khoản`}>
      <div className="mb-5">
        <label className="relative block">
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
