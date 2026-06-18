// Khu vuc tong hop, loc va gui danh gia san pham.
function ReviewForm({ newReviewData, onReviewDataChange, onCancel, onSubmit }) {
  return (
    <div className="mb-10 border border-[#cfc4c5]/40 bg-[#f9f9f9] p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-black">Đánh giá của bạn</h3>
      <form onSubmit={onSubmit}>
        <div className="mb-4 flex items-center gap-2">
          <span className="mr-2 text-sm text-[#5f5e5e]">Chất lượng:</span>
          <div className="flex cursor-pointer text-[#99854e]">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => onReviewDataChange({ ...newReviewData, rating: star })}
                className="material-symbols-outlined text-[24px]"
                style={star <= newReviewData.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                star
              </span>
            ))}
          </div>
        </div>
        <textarea
          value={newReviewData.comment}
          onChange={(e) => onReviewDataChange({ ...newReviewData, comment: e.target.value })}
          className="mb-4 min-h-[100px] w-full border border-[#cfc4c5] p-4 text-sm outline-none focus:border-black"
          placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này nhé..."
          required
        />
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="border border-[#cfc4c5] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5f5e5e] hover:border-black hover:text-black"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="bg-black px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#99854e]"
          >
            Gửi đánh giá
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProductReviewsSection({
  stats,
  filterRating,
  filteredReviews,
  displayedReviews,
  showAllReviews,
  showReviewForm,
  newReviewData,
  onFilterRatingChange,
  onToggleShowAll,
  onToggleReviewForm,
  onReviewDataChange,
  onSubmitReview,
}) {
  return (
    <div className="mt-16 border border-[#cfc4c5] bg-white p-6 md:p-12">
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[#cfc4c5]/30 pb-6 md:flex-row md:items-center">
        <h2 className="font-serif text-3xl text-black">Đánh giá từ người thuê</h2>
        <button
          onClick={() => onToggleReviewForm(!showReviewForm)}
          className="bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
        >
          Viết đánh giá
        </button>
      </div>

      {showReviewForm && (
        <ReviewForm
          newReviewData={newReviewData}
          onReviewDataChange={onReviewDataChange}
          onCancel={() => onToggleReviewForm(false)}
          onSubmit={onSubmitReview}
        />
      )}

      <div className="mb-8 flex flex-col items-center gap-8 border border-[#f9ede5] bg-[#fffbf8] p-6 md:flex-row">
        <div className="text-center md:w-1/4">
          <div className="mb-2 text-5xl font-serif text-[#99854e]">
            {stats.avg} <span className="text-2xl text-[#99854e]/60">/ 5</span>
          </div>
          <div className="mb-1 flex justify-center text-[#99854e]">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined text-[20px]"
                style={i < Math.round(stats.avg) ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                star
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap gap-3">
          <button
            onClick={() => onFilterRatingChange('all')}
            className={`px-5 py-2 text-sm border ${filterRating === 'all' ? 'border-[#99854e] text-[#99854e] bg-white' : 'border-[#cfc4c5]/50 bg-white text-[#5f5e5e]'}`}
          >
            Tất cả ({stats.total})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => onFilterRatingChange(star)}
              className={`px-5 py-2 text-sm border ${filterRating === star ? 'border-[#99854e] text-[#99854e] bg-white' : 'border-[#cfc4c5]/50 bg-white text-[#5f5e5e]'}`}
            >
              {star} Sao ({stats.counts[star]})
            </button>
          ))}
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="py-10 text-center italic text-[#5f5e5e]">Chưa có đánh giá nào cho bộ lọc này.</div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayedReviews.map((review) => (
            <div key={review.id} className="border border-[#cfc4c5]/20 bg-[#f9f9f9] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-serif text-xl text-white">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">{review.author}</p>
                    <p className="text-xs text-[#999999]">{review.date}</p>
                  </div>
                </div>
                <div className="flex text-[#99854e]">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[14px]"
                      style={i < review.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm italic leading-6 text-[#5f5e5e]">"{review.comment}"</p>
            </div>
          ))}
        </div>
      )}

      {filteredReviews.length > 3 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => onToggleShowAll(!showAllReviews)}
            className={`border px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
              showAllReviews
                ? 'border-[#cfc4c5] text-[#5f5e5e] hover:border-black hover:text-black'
                : 'border-black text-black hover:bg-black hover:text-white'
            }`}
          >
            {showAllReviews ? 'Thu gọn' : `Xem tất cả ${filteredReviews.length} đánh giá`}
          </button>
        </div>
      )}
    </div>
  );
}
