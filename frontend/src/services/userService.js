import { requestJson } from './http/request';

export const fetchUsers = async () =>
  requestJson(
    {
      url: '/users',
      method: 'GET',
    },
    'Không thể tải danh sách tài khoản.'
  );

export const updateUserRole = async (userId, role) =>
  requestJson(
    {
      url: `/users/${encodeURIComponent(userId)}/role`,
      method: 'PATCH',
      data: { role },
    },
    'Không thể cập nhật quyền tài khoản.'
  );

export const createStaffAccount = async (payload) =>
  requestJson(
    {
      url: '/users/staff',
      method: 'POST',
      data: payload,
    },
    'Không thể tạo tài khoản staff.'
  );

export const updateProfile = async (payload) =>
  requestJson(
    {
      url: '/users/profile',
      method: 'PUT',
      data: payload,
    },
    'Không thể cập nhật hồ sơ.'
  );

export const changePassword = async (payload) =>
  requestJson(
    {
      url: '/users/password',
      method: 'PUT',
      data: payload,
    },
    'Không thể đổi mật khẩu.'
  );
