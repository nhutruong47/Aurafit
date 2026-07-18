import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/authSlice';
import AlertMessage from '../ui/AlertMessage';
import ImageLightbox from '../ui/ImageLightbox';
import ImageUploadField from '../ui/ImageUploadField';

const REVIEW_EDIT_WINDOW_MS = 60 * 60 * 1000;
const ORDER_STATUS_LABELS = {
  RENTED: 'Đang thuê',
  RETURNING: 'Đang trả',
  RETURNED: 'Đã trả',
  COMPLETED: 'Hoàn tất',
};

const isWithinEditWindow = (createdAt) => {
  const createdTime = new Date(createdAt).getTime();
  return Number.isFinite(createdTime) && Date.now() < createdTime + REVIEW_EDIT_WINDOW_MS;
};

const formatReviewDate = (createdAt) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

function StarInput({ value, onChange, disabled = false, size = 24 }) {
  return (
    <div className="flex text-[#99854e]">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          aria-label={`${star} sao`}
          className="disabled:cursor-not-allowed"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: `${size}px`,
              ...(star <= value ? { fontVariationSettings: "'FILL' 1" } : {}),
            }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  newReviewData,
  eligibleRentalDetails,
  isEligibleRentalLoading,
  isSubmitting,
  onReviewDataChange,
  onCancel,
  onSubmit,
}) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleUploadsChange = (assets) => {
    const nextUploadedImages = assets
      .filter((asset) => asset?.id)
      .map((asset) => ({
        uploadAssetId: asset.id,
        url: asset.secureUrl || asset.secure_url || asset.imageUrl || asset.image_url || asset.url || '',
      }));

    setUploadedImages(nextUploadedImages);
    onReviewDataChange({
      ...newReviewData,
      uploadAssetIds: nextUploadedImages.map((image) => image.uploadAssetId),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isUploadingImages || isSubmitting || !newReviewData.rentalOrderDetailId) return;

    const payload = {
      ...newReviewData,
      uploadAssetIds: uploadedImages.map((image) => image.uploadAssetId),
    };
    onReviewDataChange(payload);

    try {
      await onSubmit?.(event, payload);
    } catch {
      // The page displays the business error returned by the API.
    }
  };

  const handleCancel = () => {
    // TODO: Uploaded assets abandoned with this draft will be cleaned by a scheduled job in an advanced phase.
    setUploadedImages([]);
    onReviewDataChange({ ...newReviewData, uploadAssetIds: [] });
    onCancel();
  };

  const hasEligibleRental = eligibleRentalDetails.length > 0;
  const isDisabled = isUploadingImages || isSubmitting;

  return (
    <div className="mb-10 border border-[#cfc4c5]/40 bg-[#f9f9f9] p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-black">Đánh giá của bạn</h3>
      <form onSubmit={handleSubmit}>
        <label className="mb-4 block text-sm text-[#5f5e5e]">
          Lượt thuê
          <select
            value={newReviewData.rentalOrderDetailId}
            disabled={isDisabled || isEligibleRentalLoading || !hasEligibleRental}
            onChange={(event) => onReviewDataChange({
              ...newReviewData,
              rentalOrderDetailId: event.target.value,
            })}
            className="mt-2 w-full border border-[#cfc4c5] bg-white px-3 py-3 text-sm text-black outline-none focus:border-black disabled:bg-[#eeeeee]"
            required
          >
            {!hasEligibleRental && (
              <option value="">
                {isEligibleRentalLoading ? 'Đang kiểm tra lượt thuê...' : 'Chưa có lượt thuê đủ điều kiện'}
              </option>
            )}
            {eligibleRentalDetails.map((detail) => (
              <option key={detail.id} value={detail.id}>
                Đơn #{detail.orderId}{detail.sku ? ` · ${detail.sku}` : ''} ·{' '}
                {ORDER_STATUS_LABELS[detail.orderStatus] || detail.orderStatus}
              </option>
            ))}
          </select>
        </label>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-[#5f5e5e]">Chất lượng:</span>
          <StarInput
            value={newReviewData.rating}
            disabled={isDisabled}
            onChange={(rating) => onReviewDataChange({ ...newReviewData, rating })}
          />
        </div>

        <textarea
          value={newReviewData.comment}
          disabled={isDisabled}
          onChange={(event) => onReviewDataChange({ ...newReviewData, comment: event.target.value })}
          className="mb-4 min-h-[100px] w-full border border-[#cfc4c5] p-4 text-sm outline-none focus:border-black disabled:bg-[#eeeeee]"
          placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này nhé..."
        />

        <div className="mb-5">
          <ImageUploadField
            multiple
            maxFiles={3}
            label="Ảnh trải nghiệm"
            disabled={isDisabled}
            onUploadsChange={handleUploadsChange}
            onUploadStateChange={({ isUploading }) => setIsUploadingImages(isUploading)}
          />
        </div>

        {!isEligibleRentalLoading && !hasEligibleRental && (
          <AlertMessage
            tone="info"
            text="Bạn chỉ có thể đánh giá sau khi đã thuê trang phục và đơn ở trạng thái hợp lệ."
            className="mb-4"
          />
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="border border-[#cfc4c5] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5f5e5e] hover:border-black hover:text-black disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isDisabled || !hasEligibleRental}
            className="bg-black px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReviewCard({
  review,
  currentUserId,
  isMutating,
  onUpdateReview,
  onDeleteReview,
  onPreviewImages,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ rating: review.rating, comment: review.comment || '' });
  const authorName = review.userFullName || 'Khách hàng AuraFit';
  const isOwner = String(review.userId) === String(currentUserId);
  const canModify = isOwner && isWithinEditWindow(review.createdAt);

  const handleSave = async () => {
    try {
      await onUpdateReview(review.id, editData);
      setIsEditing(false);
    } catch {
      // The page displays the backend validation error.
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xoá đánh giá này?')) return;

    try {
      await onDeleteReview(review.id);
    } catch {
      // The page displays the backend validation error.
    }
  };

  return (
    <article className="border border-[#cfc4c5]/20 bg-[#f9f9f9] p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black font-serif text-xl text-white">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{authorName}</p>
            <p className="text-xs text-[#999999]">{formatReviewDate(review.createdAt)}</p>
          </div>
        </div>
        {!isEditing && (
          <StarInput value={review.rating} onChange={() => {}} disabled size={15} />
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <StarInput
            value={editData.rating}
            disabled={isMutating}
            onChange={(rating) => setEditData((current) => ({ ...current, rating }))}
          />
          <textarea
            value={editData.comment}
            disabled={isMutating}
            onChange={(event) => setEditData((current) => ({ ...current, comment: event.target.value }))}
            className="min-h-[90px] w-full border border-[#cfc4c5] bg-white p-3 text-sm outline-none focus:border-black"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isMutating}
              onClick={() => setIsEditing(false)}
              className="border border-[#cfc4c5] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={handleSave}
              className="bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white disabled:bg-[#777777]"
            >
              Lưu
            </button>
          </div>
        </div>
      ) : (
        <>
          {review.comment && (
            <p className="text-sm italic leading-6 text-[#5f5e5e]">“{review.comment}”</p>
          )}
          {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {review.imageUrls.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => onPreviewImages(review.imageUrls, index)}
                  aria-label={`Xem ảnh đánh giá ${index + 1}`}
                  className="group relative overflow-hidden border border-[#ebe7df] bg-white"
                >
                  <img
                    src={imageUrl}
                    alt={`Ảnh đánh giá ${index + 1}`}
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center bg-black/0 text-[24px] text-transparent transition group-hover:bg-black/25 group-hover:text-white">
                    zoom_in
                  </span>
                </button>
              ))}
            </div>
          )}
          {canModify && (
            <div className="mt-5 flex justify-end gap-3 border-t border-[#cfc4c5]/30 pt-4">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e] hover:text-black disabled:opacity-50"
              >
                Sửa
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleDelete}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93000a] disabled:opacity-50"
              >
                Xoá
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default function ProductReviewsSection({
  reviews = [],
  summary = {},
  page = 0,
  totalPages = 0,
  totalElements = 0,
  ratingFilter = null,
  isLoading = false,
  error = '',
  successMessage = '',
  showReviewForm = false,
  newReviewData,
  eligibleRentalDetails = [],
  isEligibleRentalLoading = false,
  isMutating = false,
  onFilterRatingChange,
  onPageChange,
  onToggleReviewForm,
  onReviewDataChange,
  onSubmitReview,
  onUpdateReview,
  onDeleteReview,
}) {
  const currentUser = useAppSelector(selectCurrentUser);
  const [imagePreview, setImagePreview] = useState({ images: [], activeIndex: 0 });
  const averageRating = Number(summary.averageRating || 0);
  const totalCount = Number(summary.totalCount || 0);
  const ratingDistribution = summary.ratingDistribution || {};

  const openImagePreview = (images, activeIndex) => {
    setImagePreview({ images, activeIndex });
  };

  const closeImagePreview = () => {
    setImagePreview({ images: [], activeIndex: 0 });
  };

  return (
    <>
      <section className="mt-16 border border-[#cfc4c5] bg-white p-6 md:p-12">
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[#cfc4c5]/30 pb-6 md:flex-row md:items-center">
        <h2 className="font-serif text-3xl text-black">Đánh giá từ người thuê</h2>
        {currentUser?.id && (
          <button
            type="button"
            onClick={() => onToggleReviewForm(!showReviewForm)}
            className="bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
          >
            {showReviewForm ? 'Đóng biểu mẫu' : 'Viết đánh giá'}
          </button>
        )}
      </div>

      {error && <AlertMessage text={error} className="mb-6" />}
      {successMessage && <AlertMessage tone="success" text={successMessage} className="mb-6" />}

      {currentUser?.id && showReviewForm && (
        <ReviewForm
          newReviewData={newReviewData}
          eligibleRentalDetails={eligibleRentalDetails}
          isEligibleRentalLoading={isEligibleRentalLoading}
          isSubmitting={isMutating}
          onReviewDataChange={onReviewDataChange}
          onCancel={() => onToggleReviewForm(false)}
          onSubmit={onSubmitReview}
        />
      )}

      <div className="mb-8 flex flex-col items-center gap-8 border border-[#f9ede5] bg-[#fffbf8] p-6 md:flex-row">
        <div className="text-center md:w-1/4">
          <div className="mb-2 text-5xl font-serif text-[#99854e]">
            {averageRating.toFixed(1)} <span className="text-2xl text-[#99854e]/60">/ 5</span>
          </div>
          <div className="flex justify-center text-[#99854e]">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className="material-symbols-outlined text-[20px]"
                style={star <= Math.round(averageRating) ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                star
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onFilterRatingChange('all')}
            className={`border px-5 py-2 text-sm ${ratingFilter === null ? 'border-[#99854e] bg-white text-[#99854e]' : 'border-[#cfc4c5]/50 bg-white text-[#5f5e5e]'}`}
          >
            Tất cả ({totalCount})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onFilterRatingChange(star)}
              className={`border px-5 py-2 text-sm ${ratingFilter === star ? 'border-[#99854e] bg-white text-[#99854e]' : 'border-[#cfc4c5]/50 bg-white text-[#5f5e5e]'}`}
            >
              {star} sao ({Number(ratingDistribution[star] || 0)})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse border border-[#cfc4c5]/20 bg-[#f1eceb]" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center italic text-[#5f5e5e]">Chưa có đánh giá nào cho bộ lọc này.</div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUser?.id}
              isMutating={isMutating}
              onUpdateReview={onUpdateReview}
              onDeleteReview={onDeleteReview}
              onPreviewImages={openImagePreview}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 0 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="border border-[#cfc4c5] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] disabled:opacity-40"
          >
            Trang trước
          </button>
          <span className="text-sm text-[#5f5e5e]">
            Trang {page + 1}/{totalPages} · {totalElements} đánh giá
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1 || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="border border-[#cfc4c5] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] disabled:opacity-40"
          >
            Trang sau
          </button>
        </div>
      )}
      </section>

      <ImageLightbox
        images={imagePreview.images}
        activeIndex={imagePreview.activeIndex}
        onIndexChange={(activeIndex) => setImagePreview((current) => ({ ...current, activeIndex }))}
        onClose={closeImagePreview}
      />
    </>
  );
}
