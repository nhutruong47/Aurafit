import { requestJson } from './http/request';

export const fetchAdminEvents = async (status) =>
  requestJson(
    {
      url: '/admin/events',
      method: 'GET',
      params: status && status !== 'all' ? { status } : {},
    },
    'Không thể tải danh sách sự kiện.'
  );

export const fetchActiveEvents = async () =>
  requestJson(
    {
      url: '/events/active',
      method: 'GET',
    },
    'Không thể tải danh sách sự kiện đang hoạt động.'
  );

export const createEvent = async (eventData) =>
  requestJson(
    {
      url: '/admin/events',
      method: 'POST',
      data: eventData,
    },
    'Không thể tạo sự kiện.'
  );

export const updateEvent = async (eventId, eventData) =>
  requestJson(
    {
      url: `/admin/events/${encodeURIComponent(eventId)}`,
      method: 'PUT',
      data: eventData,
    },
    'Không thể cập nhật sự kiện.'
  );

export const deleteEvent = async (eventId) =>
  requestJson(
    {
      url: `/admin/events/${encodeURIComponent(eventId)}`,
      method: 'DELETE',
    },
    'Không thể xóa sự kiện.'
  );

export const assignEventCostumes = async (eventId, assignments) =>
  requestJson(
    {
      url: `/admin/events/${encodeURIComponent(eventId)}/costumes`,
      method: 'POST',
      data: assignments,
    },
    'Không thể cập nhật sản phẩm của sự kiện.'
  );

export const removeEventCostume = async (eventId, costumeId) =>
  requestJson(
    {
      url: `/admin/events/${encodeURIComponent(eventId)}/costumes/${encodeURIComponent(costumeId)}`,
      method: 'DELETE',
    },
    'Không thể gỡ sản phẩm khỏi sự kiện.'
  );
