import OutfitComboSection from '../components/ai/OutfitComboSection';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductHero from '../components/product/ProductHero';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import AlertMessage from '../components/ui/AlertMessage';
import { useAiRecommendations } from '../hooks/useAiRecommendations';
import { fetchCostumeById } from '../services/costumeService';
import { trackProductView, trackRecommendationClick } from '../services/interactionsService';
import { mapCostumeToProduct } from '../utils/productMapper';
import { hasUserRole } from '../utils/roles';

const initialMockReviews = [
  {
    id: 1,
    author: 'Nguyen Minh Anh',
    rating: 5,
    date: '10/05/2026', 
    comment: 'Trang phuc rat dep, chat lieu vai cao cap va len form cuc chuan. Dich vu tu van nhiet tinh, giao hang nhanh chong.',
  },
  {
    id: 2,
    author: 'Tran Hai Dang',
    rating: 4,
    date: '02/06/2026',
    comment: 'Do len form chuan, mau sac y nhu hinh chup. Co mot chut vet nhan nho do van chuyen nhung ui so la dep ngay.',
  },
  {
    id: 3,
    author: 'Le Ngoc Diep',
    rating: 5,
    date: '12/06/2026',
    comment: 'Tuyet voi! Minh thue do di du da hoi ai cung khen. Se tiep tuc ung ho AuraFit trong nhung su kien toi.',
  },
  {
    id: 4,
    author: 'Pham Thu Ha',
    rating: 3,
    date: '15/06/2026',
    comment: 'Do tam on nhung form hoi rong so voi bang size. Phai dung them kep phia sau moi vua.',
  },
  {
    id: 5,
    author: 'Hoang Van Thai',
    rating: 5,
    date: '20/06/2026',
    comment: 'Qua ung y. Do giat thom tho sach se, boc trong tui xach rat chuyen nghiep.',
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
  const { outfitCombos, isLoadingCombo, loadOutfitCombos } = useAiRecommendations({ currentUserId: currentUser?.id });

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
        const mappedProduct = costume ? mapCostumeToProduct(costume) : null;
        setProduct(mappedProduct);
        if (mappedProduct?.id) {
          trackProductView({
            productId: mappedProduct.id,
            sourcePage: 'product-detail',
            sourceModule: 'product-hero',
          });
          loadOutfitCombos({
            anchorCostumeId: mappedProduct.id,
            limit: 3,
          }).catch(() => {});
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error.message || 'Khong the tai chi tiet san pham.');
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
      author: 'Ban (Khach hang)',
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
          Quay lai
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
          <>
            <OutfitComboSection
              title={outfitCombos.anchorLabel ? `Combo quanh ${outfitCombos.anchorLabel}` : 'Combo goi y'}
              items={outfitCombos.items}
              isLoading={isLoadingCombo}
              onNavigate={onNavigate}
              onTrackClick={(item) =>
                trackRecommendationClick({
                  productId: item.product.id,
                  sourcePage: 'product-detail',
                  sourceModule: 'outfit-combo',
                  reason: item.reason,
                })
              }
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
          </>
        )}
      </div>
    </div>
  );
}
