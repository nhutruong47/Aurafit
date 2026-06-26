import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductHero from '../components/product/ProductHero';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import AlertMessage from '../components/ui/AlertMessage';
import { fetchCostumeById } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';
import { hasUserRole } from '../utils/roles';

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

export default function CostumeDetailPage({ onAddToCart, onNavigate, currentUser }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviews, setReviews] = useState(initialMockReviews);
  const [filterRating, setFilterRating] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewData, setNewReviewData] = useState({ rating: 5, comment: '' });

  const isAdmin = useMemo(() => hasUserRole(currentUser, 'ADMIN'), [currentUser]);

  useEffect(() => {
    if (!productId) {
      onNavigate?.('catalog');
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError('');

    fetchCostumeById(productId)
      .then((costume) => {
        if (!isMounted) return;
        setProduct(costume ? mapCostumeToProduct(costume) : null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error.message || 'Không thể tải chi tiết sản phẩm.');
        setProduct(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onNavigate, productId]);

  useEffect(() => {
    if (!isLoading && !product && !loadError) {
      onNavigate?.('catalog');
    }
  }, [isLoading, loadError, onNavigate, product]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1) : 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      counts[review.rating] += 1;
    });
    return { total, avg, counts };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const activeReviews = filterRating === 'all' ? reviews : reviews.filter((review) => review.rating === Number(filterRating));
    return activeReviews.sort((a, b) => b.id - a.id);
  }, [reviews, filterRating]);

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);

  const handleAddToCartClick = () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }

    onAddToCart?.(product);
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

    setReviews((currentReviews) => [newReview, ...currentReviews]);
    setNewReviewData({ rating: 5, comment: '' });
    setShowReviewForm(false);
    setFilterRating('all');
  };

  if (!product && !isLoading && !loadError) {
    return null;
  }

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

        {loadError && <AlertMessage text={loadError} className="mb-6" />}

        <ProductHero
          product={product}
          isAdmin={isAdmin}
          isLoading={isLoading}
          onAddToCart={handleAddToCartClick}
          onNavigate={onNavigate}
        />

        {product && (
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
        )}
      </div>
    </div>
  );
}
