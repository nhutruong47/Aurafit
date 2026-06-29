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
