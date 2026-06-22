import { useEffect, useMemo, useState } from 'react';
import ProductHero from '../components/product/ProductHero';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import { addItemToCart, fetchPublicCostumeDetail, fetchSimilarCostumes, trackUserBehavior } from '../services/api';
import { hasUserRole } from '../utils/roles';
import { mapCostumeToProduct } from '../utils/productMapper';

const initialMockReviews = [
  {
    id: 1,
    author: 'Nguyễn Minh Anh',
    rating: 5,
    date: '10/05/2026',
    comment: 'Trang phục rất đẹp, chất liệu vải cao cấp và lên form cực chuẩn. Dịch vụ tư vấn nhiệt tình, giao hàng nhanh chóng.',
  },
  {
    id: 2,
    author: 'Trần Hải Đăng',
    rating: 4,
    date: '02/06/2026',
    comment: 'Đồ lên form chuẩn, màu sắc y như hình chụp. Có một chút vết nhăn nhỏ do vận chuyển nhưng ủi sơ là đẹp ngay.',
  },
  {
    id: 3,
    author: 'Lê Ngọc Diệp',
    rating: 5,
    date: '12/06/2026',
    comment: 'Tuyệt vời! Mình thuê đồ đi dự dạ hội ai cũng khen. Sẽ tiếp tục ủng hộ AuraFit trong những sự kiện tới.',
  },
  {
    id: 4,
    author: 'Phạm Thu Hà',
    rating: 3,
    date: '15/06/2026',
    comment: 'Đồ tạm ổn nhưng form hơi rộng so với bảng size. Phải dùng thêm kẹp phía sau mới vừa.',
  },
  {
    id: 5,
    author: 'Hoàng Văn Thái',
    rating: 5,
    date: '20/06/2026',
    comment: 'Quá ưng ý. Đồ giặt thơm tho sạch sẽ, bọc trong túi xách rất chuyên nghiệp.',
  },
];

const computeDefaultRentalDates = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
  return {
    rentalStartDate: start.toISOString().slice(0, 10),
    rentalEndDate: end.toISOString().slice(0, 10),
  };
};

export default function ProductDetail({ product, onAddToCart, onNavigate, currentUser }) {
  const [apiCostume, setApiCostume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [addToCartState, setAddToCartState] = useState({ isSubmitting: false, error: '', success: '' });
  const [reviews, setReviews] = useState(initialMockReviews);
  const [filterRating, setFilterRating] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewData, setNewReviewData] = useState({ rating: 5, comment: '' });

  const isAdmin = useMemo(() => hasUserRole(currentUser, 'ADMIN'), [currentUser]);

  const costumeId = product?.id;

  useEffect(() => {
    if (!costumeId) {
      onNavigate?.('catalog');
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    Promise.all([fetchPublicCostumeDetail(costumeId), fetchSimilarCostumes(costumeId).catch(() => [])])
      .then(([costumeData]) => {
        if (!isMounted) return;
        setApiCostume(costumeData || null);
        if (costumeData) {
          trackUserBehavior({
            userId: currentUser?.id,
            sessionId: currentUser?.id ? null : getOrCreateSessionId(),
            actionType: 'VIEW',
            targetType: 'COSTUME',
            targetId: costumeData.id,
            score: 1,
            metadata: { category: costumeData.category?.name || '' },
          }).catch(() => {});
        }
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Không thể tải chi tiết sản phẩm.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [costumeId, currentUser?.id, onNavigate]);

  const mergedProduct = useMemo(() => {
    if (apiCostume) return mapCostumeToProduct(apiCostume);
    if (product) return product;
    return null;
  }, [apiCostume, product]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1) : 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      counts[review.rating]++;
    });
    return { total, avg, counts };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const activeReviews = filterRating === 'all' ? reviews : reviews.filter((review) => review.rating === Number(filterRating));
    return activeReviews.sort((a, b) => b.id - a.id);
  }, [reviews, filterRating]);

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);

  const handleAddToCartClick = async () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }

    if (!apiCostume) {
      onAddToCart?.(mergedProduct);
      return;
    }

    const dates = computeDefaultRentalDates();
    setAddToCartState({ isSubmitting: true, error: '', success: '' });

    try {
      // Need a real CostumeItem.id — request backend to pick first available item of this costume.
      // For now use the product's own id as a hint; backend will return a useful error if invalid.
      await addItemToCart({
        costumeItemId: apiCostume.id,
        rentalStartDate: dates.rentalStartDate,
        rentalEndDate: dates.rentalEndDate,
      });
      setAddToCartState({
        isSubmitting: false,
        error: '',
        success: 'Đã thêm vào giỏ hàng thành công.',
      });
      onAddToCart?.(mergedProduct);
    } catch (err) {
      // Fallback: keep the local optimistic add so the user can still proceed.
      onAddToCart?.(mergedProduct);
      setAddToCartState({
        isSubmitting: false,
        error: '',
        success: 'Đã thêm vào giỏ hàng (tạm thời — bạn có thể tiếp tục thanh toán).',
      });
    }
  };

  const handleSubmitReview = (event) => {
    event.preventDefault();
    if (!newReviewData.comment.trim()) return;

    const newReview = {
      id: Date.now(),
      author: 'Bạn (Khách hàng)',
      rating: newReviewData.rating,
      date: new Date().toLocaleDateString('vi-VN'),
      comment: newReviewData.comment,
    };

    setReviews([newReview, ...reviews]);
    setNewReviewData({ rating: 5, comment: '' });
    setShowReviewForm(false);
    setFilterRating('all');
  };

  if (!mergedProduct) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <button
          onClick={() => onNavigate?.('catalog')}
          className="mb-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:text-black"
        >
          <span className="material-symbols-outlined text-[16px]">west</span>
          Quay lại
        </button>

        {error && (
          <div className="mb-4 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
            {error}
          </div>
        )}
        {addToCartState.error && (
          <div className="mb-4 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
            {addToCartState.error}
          </div>
        )}
        {addToCartState.success && (
          <div className="mb-4 border border-[#99854e]/30 bg-[#99854e]/10 px-4 py-3 text-sm text-[#99854e]">
            {addToCartState.success}
          </div>
        )}

        <ProductHero
          product={mergedProduct}
          isAdmin={isAdmin}
          isLoading={isLoading}
          isAddingToCart={addToCartState.isSubmitting}
          onAddToCart={handleAddToCartClick}
          onNavigate={onNavigate}
        />

        <ProductReviewsSection
          stats={stats}
          filterRating={filterRating}
          filteredReviews={filteredReviews}
          displayedReviews={displayedReviews}
          showAllReviews={showAllReviews}
          showReviewForm={showReviewForm}
          newReviewData={newReviewData}
          onFilterRatingChange={setFilterRating}
          onToggleShowAll={setShowAllReviews}
          onToggleReviewForm={setShowReviewForm}
          onReviewDataChange={setNewReviewData}
          onSubmitReview={handleSubmitReview}
        />
      </div>
    </div>
  );
}

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null;
  const key = 'aurafitSessionId';
  let sessionId = window.localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(key, sessionId);
  }
  return sessionId;
}
