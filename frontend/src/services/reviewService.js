import { requestJson } from './http/request';

export const fetchReviewsByCostume = async (
  costumeId,
  { page = 0, size = 6, rating } = {}
) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(costumeId)}/reviews`,
      method: 'GET',
      params: {
        page,
        size,
        ...(rating ? { rating } : {}),
      },
    },
    'Không thể tải danh sách đánh giá.'
  );

export const fetchReviewSummary = async (costumeId) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(costumeId)}/reviews/summary`,
      method: 'GET',
    },
    'Không thể tải tổng quan đánh giá.'
  );

export const createReview = async (costumeId, payload) =>
  requestJson(
    {
      url: `/costumes/${encodeURIComponent(costumeId)}/reviews`,
      method: 'POST',
      data: payload,
    },
    'Không thể gửi đánh giá.'
  );

export const updateReview = async (reviewId, payload) =>
  requestJson(
    {
      url: `/reviews/${encodeURIComponent(reviewId)}`,
      method: 'PUT',
      data: payload,
    },
    'Không thể cập nhật đánh giá.'
  );

export const deleteReview = async (reviewId) =>
  requestJson(
    {
      url: `/reviews/${encodeURIComponent(reviewId)}`,
      method: 'DELETE',
    },
    'Không thể xoá đánh giá.'
  );

export const fetchAdminReviews = async ({
  page = 0,
  size = 10,
  status,
  rating,
  costumeName,
} = {}) =>
  requestJson(
    {
      url: '/admin/reviews',
      method: 'GET',
      params: {
        page,
        size,
        ...(status ? { status } : {}),
        ...(rating ? { rating } : {}),
        ...(costumeName ? { costumeName } : {}),
      },
    },
    'Không thể tải danh sách đánh giá cho quản trị viên.'
  );

export const hideReviewByAdmin = async (reviewId) =>
  requestJson(
    {
      url: `/admin/reviews/${encodeURIComponent(reviewId)}/hide`,
      method: 'PATCH',
    },
    'Không thể ẩn đánh giá.'
  );

export const restoreReviewByAdmin = async (reviewId) =>
  requestJson(
    {
      url: `/admin/reviews/${encodeURIComponent(reviewId)}/restore`,
      method: 'PATCH',
    },
    'Không thể khôi phục đánh giá.'
  );
