import { requestJson } from './http/request';

export const fetchUsers = async (options = {}) => {
  const { pageNo = 0, pageSize = 12, sortBy = 'id', sortDir = 'desc', keyword, role } = options;

  const payload = await requestJson(
    {
      url: '/users',
      method: 'GET',
      params: {
        pageNo,
        pageSize,
        sortBy,
        sortDir,
        ...(keyword ? { keyword } : {}),
        ...(role ? { role } : {}),
      },
    },
    'Hệ thống không thể truy xuất danh sách tài khoản.'
  );

  if (payload && typeof payload === 'object' && Array.isArray(payload.content)) {
    return {
      data: payload.content,
      totalPages: payload.totalPages || 1,
      totalElements: payload.totalElements || 0,
      currentPage: payload.pageNo ?? payload.number ?? pageNo,
    };
  }

  const normalizeListResponse = (p) => {
    if (Array.isArray(p)) return p;
    if (Array.isArray(p?.content)) return p.content;
    return [];
  };

  return {
    data: normalizeListResponse(payload),
    totalPages: 1,
    totalElements: normalizeListResponse(payload).length,
    currentPage: 0,
  };
};


export const createStaffAccount = async (payload) =>
  requestJson(
    {
      url: '/users/staff',
      method: 'POST',
      data: payload,
    },
    'Hệ thống gặp sự cố khi khởi tạo tài khoản nhân viên.'
  );

export const updateUserStatus = async (userId, status) =>
  requestJson(
    {
      url: `/users/${encodeURIComponent(userId)}/status`,
      method: 'PATCH',
      data: { status },
    },
    'Không thể cập nhật trạng thái tài khoản.'
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
