import { useState } from 'react';
import AlertMessage from '../ui/AlertMessage';
import { changePassword } from '../../services/userService';

export default function ProfileTab({ currentUser }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setProfileErr('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    setProfileErr('');
    setProfileMsg('');
    setIsChangingPwd(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setProfileMsg('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setProfileErr(err.message || 'Lỗi đổi mật khẩu. 🥺');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-none md:rounded-sm bg-white border border-[#d7d2c8] shadow-sm p-6">
        <h3 className="font-serif italic text-xl font-normal text-[#171717] mb-4 border-b pb-3">Thông tin cá nhân</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">{currentUser?.fullName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">{currentUser?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vai trò</label>
            <div className="mt-1 p-3 bg-[#f4f4f2] border border-[#d7d2c8] rounded-md font-mono text-[#7f7041] font-bold">{currentUser?.role}</div>
          </div>
        </div>
      </div>

      <div className="rounded-none md:rounded-sm bg-white border border-[#d7d2c8] shadow-sm p-6">
        <h3 className="font-serif italic text-xl font-normal text-[#171717] mb-4 border-b pb-3">Đổi mật khẩu</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {profileMsg && <AlertMessage tone="success" text={profileMsg} />}
          {profileErr && <AlertMessage text={profileErr} />}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="block w-full rounded-md border-[#d7d2c8] focus:border-[#7f7041] focus:ring-[#7f7041] sm:text-sm h-10 border px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border-[#d7d2c8] focus:border-[#7f7041] focus:ring-[#7f7041] sm:text-sm h-10 border px-3"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPwd || !oldPassword || !newPassword}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors disabled:bg-[#d7d2c8]"
          >
            {isChangingPwd ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
