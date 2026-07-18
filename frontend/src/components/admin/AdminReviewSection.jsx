import { useEffect, useState } from 'react';
import {
  fetchAdminReviews,
  hideReviewByAdmin,
  restoreReviewByAdmin,
} from '../../services/reviewService';
import ImageLightbox from '../ui/ImageLightbox';
import AdminDrawer from './AdminDrawer';
import { Panel, StatusBadge } from './AdminDashboardShared';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

export default function AdminReviewSection() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [costumeNameFilter, setCostumeNameFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingReviewId, setUpdatingReviewId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [imagePreview, setImagePreview] = useState({ images: [], activeIndex: 0 });

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError('');

    fetchAdminReviews({
      page,
      size: PAGE_SIZE,
      status: statusFilter || undefined,
      rating: ratingFilter ? Number(ratingFilter) : undefined,
      costumeName: costumeNameFilter.trim() || undefined,
    })
      .then((responsePage) => {
        if (!isMounted) return;

        const content = Array.isArray(responsePage?.content) ? responsePage.content : [];
        setReviews(content);
        setTotalPages(Number(responsePage?.totalPages || 0));
        setTotalElements(Number(responsePage?.totalElements || content.length));
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setReviews([]);
        setTotalPages(0);
        setTotalElements(0);
        setError(requestError.message || 'Không thể tải danh sách đánh giá.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [costumeNameFilter, page, ratingFilter, reloadKey, statusFilter]);

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
    setMessage('');
  };

  const handleRatingFilterChange = (event) => {
    setRatingFilter(event.target.value);
    setPage(0);
    setMessage('');
  };

  const handleCostumeNameFilterChange = (event) => {
    setCostumeNameFilter(event.target.value);
    setPage(0);
    setMessage('');
  };

  const handleModerate = async (review) => {
    const shouldHide = review.status === 'VISIBLE';
    setUpdatingReviewId(review.id);
    setMessage('');
    setError('');

    try {
      if (shouldHide) {
        await hideReviewByAdmin(review.id);
      } else {
        await restoreReviewByAdmin(review.id);
      }
      const nextStatus = shouldHide ? 'HIDDEN_BY_ADMIN' : 'VISIBLE';
      setSelectedReview((currentReview) => (
        currentReview?.id === review.id
          ? { ...currentReview, status: nextStatus }
          : currentReview
      ));
      setMessage(shouldHide ? 'Đã ẩn đánh giá vi phạm.' : 'Đã khôi phục đánh giá.');

      if (page > 0 && reviews.length === 1) {
        setPage((currentPage) => Math.max(0, currentPage - 1));
      } else {
        setReloadKey((currentKey) => currentKey + 1);
      }
    } catch (requestError) {
      setError(requestError.message || (shouldHide
        ? 'Không thể ẩn đánh giá.'
        : 'Không thể khôi phục đánh giá.'));
    } finally {
      setUpdatingReviewId(null);
    }
  };

  const openImagePreview = (images, activeIndex) => {
    setImagePreview({ images, activeIndex });
  };

  const closeImagePreview = () => {
    setImagePreview({ images: [], activeIndex: 0 });
  };

  return (
    <>
      <Panel title="Quản lý đánh giá" action={`${totalElements} đánh giá`}>
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
            Trạng thái
          </span>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="VISIBLE">Đang hiển thị</option>
            <option value="HIDDEN_BY_ADMIN">Đã bị ẩn</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
            Tên sản phẩm
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
              search
            </span>
            <input
              type="search"
              value={costumeNameFilter}
              onChange={handleCostumeNameFilterChange}
              placeholder="Tìm theo tên sản phẩm"
              className="w-full border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
            Số sao
          </span>
          <select
            value={ratingFilter}
            onChange={handleRatingFilterChange}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
          >
            <option value="">Tất cả số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </label>
      </div>

      {message && (
        <p className="mb-5 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-[#5f5e5e]">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#d7d2c8]">reviews</span>
          <p className="text-sm text-[#5f5e5e]">Không có đánh giá nào khớp bộ lọc hiện tại.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                <tr>
                  <th className="px-4 py-3">Trang phục</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 text-center">Điểm</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">Ảnh</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                {reviews.map((review) => {
                  const isUpdating = updatingReviewId === review.id;
                  const isVisible = review.status === 'VISIBLE';

                  return (
                    <tr key={review.id} className="align-top transition hover:bg-[#f5f2eb]">
                      <td className="px-4 py-4">
                        <p className="font-medium text-black">{review.costumeName || '—'}</p>
                        <p className="mt-1 font-mono text-xs text-[#777777]">Costume #{review.costumeId}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-black">{review.userFullName || 'Khách hàng AuraFit'}</p>
                        <p className="mt-1 font-mono text-xs text-[#777777]">User #{review.userId}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#7f7041]">
                          {review.rating}
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                        </span>
                      </td>
                      <td className="max-w-[320px] px-4 py-4">
                        <p className="line-clamp-3 leading-6 text-[#5f5e5e]">{review.comment || 'Không có nội dung'}</p>
                        <p className="mt-2 text-xs text-[#999999]">{formatDateTime(review.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                          <div className="flex gap-2">
                            {review.imageUrls.map((imageUrl, index) => (
                              <button
                                key={`${imageUrl}-${index}`}
                                type="button"
                                onClick={() => openImagePreview(review.imageUrls, index)}
                                aria-label={`Xem ảnh review ${index + 1}`}
                                className="group relative block overflow-hidden"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Ảnh review ${index + 1}`}
                                  className="h-12 w-12 border border-[#d7d2c8] object-cover transition group-hover:scale-105"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#999999]">Không có ảnh</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={isVisible ? 'Đang hiển thị' : 'Đã bị ẩn'}
                          tone={isVisible ? 'good' : 'warning'}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReview(review)}
                            className="inline-flex items-center gap-1 border border-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleModerate(review)}
                            className={`inline-flex items-center gap-1 border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isVisible
                                ? 'border-red-300 text-red-600 hover:bg-red-600 hover:text-white'
                                : 'border-green-300 text-green-700 hover:bg-green-700 hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isVisible ? 'visibility_off' : 'visibility'}
                            </span>
                            {isUpdating ? 'Đang xử lý...' : isVisible ? 'Ẩn' : 'Khôi phục'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
          />
        </>
      )}
      </Panel>

      <AdminDrawer
        isOpen={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        title={selectedReview ? `Chi tiết đánh giá #${selectedReview.id}` : 'Chi tiết đánh giá'}
        width="max-w-2xl"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7d2c8] pb-5">
              <div className="flex items-center gap-2 text-[#7f7041]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-[22px]"
                    style={star <= selectedReview.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    star
                  </span>
                ))}
                <span className="ml-1 text-sm font-semibold text-black">{selectedReview.rating}/5</span>
              </div>
              <StatusBadge
                label={selectedReview.status === 'VISIBLE' ? 'Đang hiển thị' : 'Đã bị ẩn'}
                tone={selectedReview.status === 'VISIBLE' ? 'good' : 'warning'}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[#ebe7df] bg-[#fafaf8] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Trang phục</p>
                <p className="mt-2 font-medium text-black">{selectedReview.costumeName || '—'}</p>
                <p className="mt-1 font-mono text-xs text-[#777777]">Costume #{selectedReview.costumeId}</p>
              </div>
              <div className="border border-[#ebe7df] bg-[#fafaf8] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Khách hàng</p>
                <p className="mt-2 font-medium text-black">{selectedReview.userFullName || 'Khách hàng AuraFit'}</p>
                <p className="mt-1 font-mono text-xs text-[#777777]">User #{selectedReview.userId}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Thời gian đánh giá</p>
              <p className="mt-2 text-sm text-black">{formatDateTime(selectedReview.createdAt)}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Nội dung</p>
              <p className="mt-2 whitespace-pre-wrap border border-[#ebe7df] bg-[#fafaf8] p-4 text-sm leading-7 text-[#5f5e5e]">
                {selectedReview.comment || 'Không có nội dung đánh giá.'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Ảnh đính kèm</p>
              {Array.isArray(selectedReview.imageUrls) && selectedReview.imageUrls.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selectedReview.imageUrls.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => openImagePreview(selectedReview.imageUrls, index)}
                      aria-label={`Xem ảnh review ${index + 1}`}
                      className="group relative overflow-hidden border border-[#d7d2c8] bg-white"
                    >
                      <img
                        src={imageUrl}
                        alt={`Ảnh review ${index + 1}`}
                        className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center bg-black/0 text-[26px] text-transparent transition group-hover:bg-black/25 group-hover:text-white">
                        zoom_in
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#999999]">Review này không có ảnh đính kèm.</p>
              )}
            </div>

            <div className="border-t border-[#d7d2c8] pt-5">
              <button
                type="button"
                disabled={updatingReviewId === selectedReview.id}
                onClick={() => handleModerate(selectedReview)}
                className={`w-full border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedReview.status === 'VISIBLE'
                    ? 'border-red-300 text-red-600 hover:bg-red-600 hover:text-white'
                    : 'border-green-300 text-green-700 hover:bg-green-700 hover:text-white'
                }`}
              >
                {updatingReviewId === selectedReview.id
                  ? 'Đang xử lý...'
                  : selectedReview.status === 'VISIBLE'
                    ? 'Ẩn đánh giá'
                    : 'Khôi phục đánh giá'}
              </button>
            </div>
          </div>
        )}
      </AdminDrawer>

      <ImageLightbox
        images={imagePreview.images}
        activeIndex={imagePreview.activeIndex}
        onIndexChange={(activeIndex) => setImagePreview((current) => ({ ...current, activeIndex }))}
        onClose={closeImagePreview}
      />
    </>
  );
}
