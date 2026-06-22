import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ProductHero from '../components/product/ProductHero';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import { useCostumes } from '../hooks/useCostumes';
import { hasUserRole } from '../utils/roles';

const initialMockReviews = [
  {
    id: 1,
    author: 'Nguyá»…n Minh Anh',
    rating: 5,
    date: '10/05/2026',
    comment: 'Trang phá»¥c ráº¥t Ä‘áº¹p, cháº¥t liá»‡u váº£i cao cáº¥p vÃ  lÃªn form cá»±c chuáº©n. Dá»‹ch vá»¥ tÆ° váº¥n nhiá»‡t tÃ¬nh, giao hÃ ng nhanh chÃ³ng.',
  },
  {
    id: 2,
    author: 'Tráº§n Háº£i ÄÄƒng',
    rating: 4,
    date: '02/06/2026',
    comment: 'Äá»“ lÃªn form chuáº©n, mÃ u sáº¯c y nhÆ° hÃ¬nh chá»¥p. CÃ³ má»™t chÃºt váº¿t nhÄƒn nhá» do váº­n chuyá»ƒn nhÆ°ng á»§i sÆ¡ lÃ  Ä‘áº¹p ngay.',
  },
  {
    id: 3,
    author: 'LÃª Ngá»c Diá»‡p',
    rating: 5,
    date: '12/06/2026',
    comment: 'Tuyá»‡t vá»i! MÃ¬nh thuÃª Ä‘á»“ Ä‘i dá»± dáº¡ há»™i ai cÅ©ng khen. Sáº½ tiáº¿p tá»¥c á»§ng há»™ AuraFit trong nhá»¯ng sá»± kiá»‡n tá»›i.',
  },
  {
    id: 4,
    author: 'Pháº¡m Thu HÃ ',
    rating: 3,
    date: '15/06/2026',
    comment: 'Äá»“ táº¡m á»•n nhÆ°ng form hÆ¡i rá»™ng so vá»›i báº£ng size. Pháº£i dÃ¹ng thÃªm káº¹p phÃ­a sau má»›i vá»«a.',
  },
  {
    id: 5,
    author: 'HoÃ ng VÄƒn ThÃ¡i',
    rating: 5,
    date: '20/06/2026',
    comment: 'QuÃ¡ Æ°ng Ã½. Äá»“ giáº·t thÆ¡m tho sáº¡ch sáº½, bá»c trong tÃºi xÃ¡ch ráº¥t chuyÃªn nghiá»‡p.',
  },
];

export default function ProductDetail({ onAddToCart, onNavigate, currentUser }) {
  const location = useLocation();
  const { productId } = useParams();
  const { costumes, isLoading } = useCostumes();
  const [reviews, setReviews] = useState(initialMockReviews);
  const [filterRating, setFilterRating] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewData, setNewReviewData] = useState({ rating: 5, comment: '' });

  const routeProduct = location.state?.product;
  const product = useMemo(() => {
    if (routeProduct && String(routeProduct.id) === productId) {
      return routeProduct;
    }

    return costumes.find((item) => String(item.id) === productId) || null;
  }, [costumes, productId, routeProduct]);
  const isAdmin = useMemo(() => hasUserRole(currentUser, 'ADMIN'), [currentUser]);

  useEffect(() => {
    if (!isLoading && !product) {
      onNavigate?.('catalog');
    }
  }, [isLoading, product, onNavigate]);

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

  const handleSubmitReview = (event) => {
    event.preventDefault();
    if (!newReviewData.comment.trim()) return;

    const newReview = {
      id: Date.now(),
      author: 'Báº¡n (KhÃ¡ch hÃ ng)',
      rating: newReviewData.rating,
      date: new Date().toLocaleDateString('vi-VN'),
      comment: newReviewData.comment,
    };

    setReviews([newReview, ...reviews]);
    setNewReviewData({ rating: 5, comment: '' });
    setShowReviewForm(false);
    setFilterRating('all');
  };

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <button
          onClick={() => onNavigate?.('catalog')}
          className="mb-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:text-black"
        >
          <span className="material-symbols-outlined text-[16px]">west</span>
          Quay láº¡i
        </button>

        <ProductHero
          product={product}
          isAdmin={isAdmin}
          onAddToCart={onAddToCart}
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
