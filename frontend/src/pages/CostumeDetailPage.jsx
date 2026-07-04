import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductHero from '../components/product/ProductHero';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import SimilarProductsSection from '../components/product/SimilarProductsSection';
import { useSimilarProducts } from '../hooks/useSimilarProducts';
import AlertMessage from '../components/ui/AlertMessage';
import { fetchCostumeById } from '../services/costumeService';
import { logUserInteraction } from '../services/interactionsService';
import { mapCostumeToProduct, toCartItem } from '../utils/productMapper';
import { adminContact } from '../utils/shopMock';

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

export default function CostumeDetailPage({ onAddToCart, onRentNow, onNavigate, currentUser }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviews, setReviews] = useState(initialMockReviews);
  const [filterRating, setFilterRating] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewData, setNewReviewData] = useState({ rating: 5, comment: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [rentalStartDate, setRentalStartDate] = useState(() => getLocalDateString(0));
  const [rentalEndDate, setRentalEndDate] = useState(() => getLocalDateString(1));
  const impressionKeyRef = useRef('');

  const {
    recommendations: similarRecommendations,
    isLoading: isSimilarLoading,
    error: similarError,
  } = useSimilarProducts(product?.id);

  useEffect(() => {
    if (!productId) {
      onNavigate?.('catalog');
      return undefined;
    }

    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setLoadError('');
    setSelectedItem(null);

    fetchCostumeById(productId)
      .then((costume) => {
        if (!isMounted) return;
        const mapped = costume ? mapCostumeToProduct(costume) : null;
        setProduct(mapped);
        if (mapped?.items?.length > 0) {
          setSelectedItem(mapped.items[0]);
        }
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

  useEffect(() => {
    if (!product?.id) return;

    logUserInteraction({
      eventType: 'VIEW_PRODUCT',
      targetType: 'COSTUME',
      targetId: product.id,
      metadata: {
        category: product.apiCategoryName || product.category,
        style: product.style,
        occasion: product.occasion,
        season: product.season,
      },
    }).catch(() => {});
  }, [product]);

  useEffect(() => {
    if (!product?.id || !similarRecommendations.length) return;

    const recommendedIds = similarRecommendations
      .map((item) => item?.product?.id)
      .filter((id) => id !== undefined && id !== null);
    const impressionKey = `${product.id}:${recommendedIds.join(',')}`;

    if (!recommendedIds.length || impressionKeyRef.current === impressionKey) {
      return;
    }

    impressionKeyRef.current = impressionKey;

    logUserInteraction({
      eventType: 'RECOMMENDATION_IMPRESSION',
      targetType: 'RECOMMENDATION',
      targetId: product.id,
      metadata: {
        slot: 'similar_products',
        sourceCostumeId: product.id,
        recommendedCostumeIds: recommendedIds,
      },
    }).catch(() => {});
  }, [product?.id, similarRecommendations]);

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

  const handleAddToCartClick = async (itemFromHero) => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return false;
    }
    if (!selectedItem && product.items?.length > 0) {
      alert('Vui lòng chọn kích thước/loại trước khi thêm vào giỏ.');
      return false;
    }
    // itemFromHero contains quantity and dates mapped by ProductHero
    const finalItem = itemFromHero || toCartItem(product, selectedItem);
    await onAddToCart?.(finalItem);
    return true;
  };

  const handleRentNowClick = () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }
    if (!selectedItem) return;
    const baseItem = toCartItem(product, selectedItem);
    onRentNow?.({
      ...baseItem,
      rentalStartDate,
      rentalEndDate,
    });
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

  const handleRecommendationClick = (recommendation, index, page, recommendedProduct) => {
    if (page !== 'productDetail' || !recommendedProduct?.id || !product?.id) {
      return;
    }

    logUserInteraction({
      eventType: 'RECOMMENDATION_CLICK',
      targetType: 'RECOMMENDATION',
      targetId: recommendedProduct.id,
      metadata: {
        slot: 'similar_products',
        sourceCostumeId: product.id,
        recommendedCostumeId: recommendedProduct.id,
        reason: recommendation?.reason || null,
        position: index + 1,
      },
    }).catch(() => {});
  };

  if (!product && !isLoading && !loadError) {
    return null;
  }

  // Seller info derived from product data
  const sellerName = product?.sellerName || product?.owner?.fullName || product?.owner?.email || adminContact.name;
  const sellerEmail = product?.sellerEmail || product?.owner?.email || '';

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:text-black"
        >
          <span className="material-symbols-outlined text-[16px]">west</span>
          Quay lại
        </button>

        {loadError && <AlertMessage text={loadError} className="mb-6" />}

        {/* ── Hero: Image + Variants + CTAs (Above the Fold) ── */}
        <ProductHero
          product={product}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          isLoading={isLoading}
          onAddToCart={handleAddToCartClick}
          onRentNow={handleRentNowClick}
          rentalStartDate={rentalStartDate}
          rentalEndDate={rentalEndDate}
          onStartDateChange={setRentalStartDate}
          onEndDateChange={setRentalEndDate}
        />

        {/* ── Description + Seller Info (Below the Fold) ── */}
        {product && (
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
            {/* Description */}
            <div className="border border-[#cfc4c5] bg-white p-6">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">Mô tả sản phẩm</h3>
              <p className="text-sm leading-7 text-[#5f5e5e]">
                {product.description || 'Trang phục cao cấp mang đến trải nghiệm nổi bật cho sự kiện của bạn. Thiết kế tỉ mỉ, chất liệu chỉn chu và kiểu dáng ấn tượng giúp bạn tỏa sáng ở mọi góc nhìn.'}
              </p>
            </div>

            {/* Seller Card */}
            <div className="flex flex-col justify-between border border-[#cfc4c5] bg-white p-5">
              <div className="flex items-center gap-4">
                <img
                  src={adminContact.avatar}
                  alt={sellerName}
                  className="h-14 w-14 rounded-full border border-[#cfc4c5]/50 object-cover"
                />
                <div>
                  <h4 className="font-serif text-lg font-bold">{sellerName}</h4>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#5f5e5e]">
                    <span className="flex items-center text-[#99854e]">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {adminContact.rating}
                    </span>
                    <span>•</span>
                    <span>{sellerEmail || adminContact.address.split(',').slice(-2).join(', ').trim()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('chat', product)}
                className="mt-4 w-full border border-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all duration-300 hover:bg-black hover:text-white"
              >
                Chatbot tư vấn
              </button>
            </div>
          </div>
        )}

        {/* ── Similar Products ── */}
        {product && (
          <SimilarProductsSection
            recommendations={similarRecommendations}
            isLoading={isSimilarLoading}
            error={similarError}
            onNavigate={onNavigate}
            onRecommendationClick={handleRecommendationClick}
          />
        )}

        {/* ── Reviews ── */}
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
