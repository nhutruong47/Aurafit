import { requestJson } from './http/request';

export const fetchUsers = async () =>
  requestJson(
    {
      url: '/users',
      method: 'GET',
    },
    'Hệ thống không thể truy xuất danh sách tài khoản.'
  );


export const createStaffAccount = async (payload) =>
  requestJson(
    {
      url: '/users/staff',
      method: 'POST',
      data: payload,
    },
    'Hệ thống gặp sự cố khi khởi tạo tài khoản nhân viên.'
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
