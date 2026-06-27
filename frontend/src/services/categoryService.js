import { requestJson } from './http/request';

export const createCategory = async (payload) =>
  requestJson(
    { url: '/categories', method: 'POST', data: payload },
    'Không thể tạo danh mục.'
  );

export const updateCategory = async (id, payload) =>
  requestJson(
    { url: `/categories/${id}`, method: 'PUT', data: payload },
    'Không thể cập nhật danh mục.'
  );

export const deleteCategory = async (id) =>
  requestJson(
    { url: `/categories/${id}`, method: 'DELETE' },
    'Không thể xóa danh mục.'
  );
