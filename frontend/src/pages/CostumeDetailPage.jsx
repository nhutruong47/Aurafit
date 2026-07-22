import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import EventSideBanner from '../components/catalog/EventSideBanner';
import ProductHero from '../components/product/ProductHero';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import TryOnPanel from '../components/product/TryOnPanel';
import AlertMessage from '../components/ui/AlertMessage';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents';
import { fetchCostumeById, fetchRelatedCostumes } from '../services/costumeService';
import { logUserInteraction } from '../services/interactionsService';
import { fetchOrderDetail, fetchOrders } from '../services/rentalOrderService';
import {
  createReview,
  deleteReview,
  fetchReviewsByCostume,
  fetchReviewSummary,
  updateReview,
} from '../services/reviewService';
import {
  getCostumeApiCategoryName,
  getCostumeImage,
  toCartItemFromCostume,
} from '../utils/costumeUtils';

const REVIEW_PAGE_SIZE = 6;
const REVIEWABLE_ORDER_STATUSES = new Set(['RENTED', 'RETURNING', 'RETURNED', 'COMPLETED']);
const EMPTY_REVIEW_SUMMARY = {
  averageRating: 0,
  totalCount: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const getReviewErrorMessage = (error, fallbackMessage) => {
  const message = error?.message || '';
  const normalizedMessage = message.toLocaleLowerCase('vi-VN');

  if (normalizedMessage.includes('đã đánh giá')) {
    return 'Bạn đã đánh giá lượt thuê này rồi.';
  }
  if (normalizedMessage.includes('trạng thái cho phép đánh giá')) {
    return 'Lượt thuê này chưa đủ điều kiện để đánh giá.';
  }
  if (normalizedMessage.includes('quyền đánh giá')) {
    return 'Bạn không đủ điều kiện đánh giá lượt thuê này.';
  }
  if (normalizedMessage.includes('quá thời gian cho phép chỉnh sửa')) {
    return 'Đã quá thời gian cho phép chỉnh sửa.';
  }

  return message || fallbackMessage;
};

export default function CostumeDetailPage({ onAddToCart, onRentNow, onNavigate, currentUser }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(EMPTY_REVIEW_SUMMARY);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewTotalElements, setReviewTotalElements] = useState(0);
  const [reviewRatingFilter, setReviewRatingFilter] = useState(null);
  const [reviewReloadKey, setReviewReloadKey] = useState(0);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    rentalOrderDetailId: '',
    rating: 5,
    comment: '',
    uploadAssetIds: [],
  });
  const [eligibleRentalDetails, setEligibleRentalDetails] = useState([]);
  const [isEligibleRentalLoading, setIsEligibleRentalLoading] = useState(false);
  const [isReviewMutating, setIsReviewMutating] = useState(false);

  const getLocalDateString = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [rentalStartDate, setRentalStartDate] = useState(() => getLocalDateString(0));
  const [rentalEndDate, setRentalEndDate] = useState(() => getLocalDateString(1));
  const tryOnRef = useRef(null);
  const tryOnBtnRef = useRef(null);
  const chatBtnRef = useRef(null);
  const { leftEvent, rightEvent } = useFeaturedEvents(2);

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
        if (!isMounted) {
          return;
        }

        setProduct(costume || null);

        if (Array.isArray(costume?.items) && costume.items.length > 0) {
          setSelectedItem(costume.items[0]);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

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
    if (!productId) {
      return undefined;
    }

    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRelatedLoading(true);
    setRelatedProducts([]);

    fetchRelatedCostumes(productId)
      .then((costumes) => {
        if (isMounted) {
          setRelatedProducts(costumes);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRelatedProducts([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRelatedLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      return undefined;
    }

    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReviewsLoading(true);
    setReviewError('');

    Promise.all([
      fetchReviewsByCostume(productId, {
        page: reviewPage,
        size: REVIEW_PAGE_SIZE,
        rating: reviewRatingFilter,
      }),
      fetchReviewSummary(productId),
    ])
      .then(([reviewsPage, summary]) => {
        if (!isMounted) return;

        const content = Array.isArray(reviewsPage?.content) ? reviewsPage.content : [];
        setReviews(content);
        setReviewTotalPages(Number(reviewsPage?.totalPages || 0));
        setReviewTotalElements(Number(reviewsPage?.totalElements || content.length));
        setReviewSummary(summary || EMPTY_REVIEW_SUMMARY);
      })
      .catch((error) => {
        if (!isMounted) return;
        setReviews([]);
        setReviewSummary(EMPTY_REVIEW_SUMMARY);
        setReviewError(getReviewErrorMessage(error, 'Không thể tải đánh giá sản phẩm.'));
      })
      .finally(() => {
        if (isMounted) setIsReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, reviewPage, reviewRatingFilter, reviewReloadKey]);

  useEffect(() => {
    if (!currentUser?.id || !product?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEligibleRentalDetails([]);
      setIsEligibleRentalLoading(false);
      return undefined;
    }

    let isMounted = true;
    setIsEligibleRentalLoading(true);

    fetchOrders()
      .then((orders) => Promise.all(
        orders
          .filter((order) => REVIEWABLE_ORDER_STATUSES.has(order?.status))
          .map((order) => fetchOrderDetail(order.id))
      ))
      .then((orders) => {
        if (!isMounted) return;

        const costumeItemIds = new Set(
          (product.items || []).map((item) => String(item.id))
        );
        const matchingDetails = orders
          .flatMap((order) => (order.details || [])
            .filter((detail) => costumeItemIds.has(String(detail.costumeItemId)))
            .map((detail) => ({
              id: detail.id,
              orderId: order.id,
              orderStatus: order.status,
              orderCreatedAt: order.createdAt,
              costumeName: detail.costumeName,
              sku: detail.skuCode || detail.sku || '',
            })))
          .sort((left, right) => new Date(right.orderCreatedAt) - new Date(left.orderCreatedAt));

        setEligibleRentalDetails(matchingDetails);
        setNewReviewData((currentData) => ({
          ...currentData,
          rentalOrderDetailId: matchingDetails.some(
            (detail) => String(detail.id) === String(currentData.rentalOrderDetailId)
          )
            ? currentData.rentalOrderDetailId
            : matchingDetails[0]?.id || '',
        }));
      })
      .catch(() => {
        if (isMounted) setEligibleRentalDetails([]);
      })
      .finally(() => {
        if (isMounted) setIsEligibleRentalLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, product]);

  useEffect(() => {
    if (!isLoading && !product && !loadError) {
      onNavigate?.('catalog');
    }
  }, [isLoading, loadError, onNavigate, product]);

  useEffect(() => {
    if (!product?.id) {
      return;
    }

    logUserInteraction({
      eventType: 'VIEW_PRODUCT',
      targetType: 'COSTUME',
      targetId: product.id,
      metadata: {
        category: getCostumeApiCategoryName(product),
        style: product.metadata?.style,
        occasion: product.metadata?.occasion,
        season: product.metadata?.season,
      },
    }).catch(() => {});
  }, [product]);

  useEffect(() => {
    const tryEqualize = () => {
      const a = tryOnBtnRef.current;
      const b = chatBtnRef.current;
      if (!a || !b) return;

      a.style.width = 'auto';
      b.style.width = 'auto';

      const max = Math.max(a.offsetWidth, b.offsetWidth);
      a.style.width = `${max}px`;
      b.style.width = `${max}px`;
    };

    tryEqualize();
    window.addEventListener('resize', tryEqualize);
    return () => window.removeEventListener('resize', tryEqualize);
  }, [product]);

  const handleAddToCartClick = async (itemFromHero) => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return false;
    }

    if (!selectedItem && product?.items?.length > 0) {
      alert('Vui lòng chọn kích thước/loại trước khi thêm vào giỏ.');
      return false;
    }

    const finalItem = itemFromHero || toCartItemFromCostume(product, selectedItem);
    await onAddToCart?.(finalItem);
    return true;
  };

  const handleRentNowClick = () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }

    if (!selectedItem) {
      return;
    }

    const baseItem = toCartItemFromCostume(product, selectedItem);
    onRentNow?.({
      ...baseItem,
      rentalStartDate,
      rentalEndDate,
    });
  };

  const refreshReviews = () => {
    setReviewReloadKey((currentKey) => currentKey + 1);
  };

  const handleReviewFilterChange = (rating) => {
    setReviewRatingFilter(rating === 'all' ? null : rating);
    setReviewPage(0);
  };

  const handleToggleReviewForm = (nextValue) => {
    setShowReviewForm(nextValue);
    setReviewError('');
    setReviewSuccess('');
  };

  const handleSubmitReview = async (_event, payload) => {
    if (!currentUser?.id || !product?.id) return;

    const rentalOrderDetailId = Number(payload?.rentalOrderDetailId);
    if (!rentalOrderDetailId) {
      setReviewError('Bạn chưa có lượt thuê hợp lệ cho trang phục này.');
      return;
    }

    setIsReviewMutating(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await createReview(product.id, {
        rentalOrderDetailId,
        rating: Number(payload.rating),
        comment: payload.comment?.trim() || null,
        uploadAssetIds: payload.uploadAssetIds || [],
      });
      setReviewSuccess('Đánh giá của bạn đã được gửi thành công.');
      setShowReviewForm(false);
      setReviewPage(0);
      const remainingRentalDetails = eligibleRentalDetails.filter(
        (detail) => Number(detail.id) !== rentalOrderDetailId
      );
      setNewReviewData({
        rentalOrderDetailId: remainingRentalDetails[0]?.id || '',
        rating: 5,
        comment: '',
        uploadAssetIds: [],
      });
      setEligibleRentalDetails(remainingRentalDetails);
      refreshReviews();
    } catch (error) {
      setReviewError(getReviewErrorMessage(error, 'Không thể gửi đánh giá.'));
      if (error?.message?.toLocaleLowerCase('vi-VN').includes('đã đánh giá')) {
        const remainingRentalDetails = eligibleRentalDetails.filter(
          (detail) => Number(detail.id) !== rentalOrderDetailId
        );
        setEligibleRentalDetails(remainingRentalDetails);
        setNewReviewData((currentData) => ({
          ...currentData,
          rentalOrderDetailId: remainingRentalDetails[0]?.id || '',
        }));
      }
      throw error;
    } finally {
      setIsReviewMutating(false);
    }
  };

  const handleUpdateReview = async (reviewId, payload) => {
    setIsReviewMutating(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await updateReview(reviewId, {
        rating: Number(payload.rating),
        comment: payload.comment?.trim() || null,
      });
      setReviewSuccess('Đánh giá đã được cập nhật.');
      refreshReviews();
    } catch (error) {
      setReviewError(getReviewErrorMessage(error, 'Không thể cập nhật đánh giá.'));
      throw error;
    } finally {
      setIsReviewMutating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setIsReviewMutating(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await deleteReview(reviewId);
      setReviewSuccess('Đánh giá đã được xoá.');
      if (reviewPage > 0 && reviews.length === 1) {
        setReviewPage((currentPage) => Math.max(0, currentPage - 1));
      } else {
        refreshReviews();
      }
    } catch (error) {
      setReviewError(getReviewErrorMessage(error, 'Không thể xoá đánh giá.'));
      throw error;
    } finally {
      setIsReviewMutating(false);
    }
  };

  if (!product && !isLoading && !loadError) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-4 pb-12 pt-4 sm:px-6 lg:px-8 xl:px-0">
      <div className="w-full xl:grid xl:grid-cols-[minmax(120px,1fr)_minmax(0,1200px)_minmax(120px,1fr)] xl:items-stretch" data-event-page-grid="costume-detail">
        <aside className="hidden min-h-0 self-stretch xl:block" aria-label="Sự kiện nổi bật bên trái">
          {leftEvent && <EventSideBanner side="left" event={leftEvent} />}
        </aside>

        <div className="mx-auto w-full min-w-0 max-w-[1200px] xl:mx-0" data-event-page-content="costume-detail">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:text-black"
        >
          <span className="material-symbols-outlined text-[16px]">west</span>
          Quay lại
        </button>

        {loadError && <AlertMessage text={loadError} className="mb-6" />}

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

        {product && (
          <div className="mt-6">
            <div className="border border-[#cfc4c5] bg-white p-6">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">Mô tả sản phẩm</h3>
              <p className="text-sm leading-7 text-[#5f5e5e]">
                {product.description ||
                  'Trang phục cao cấp mang đến trải nghiệm nổi bật cho sự kiện của bạn. Thiết kế tỉ mỉ, chất liệu chỉn chu và kiểu dáng ấn tượng giúp bạn tỏa sáng ở mọi góc nhìn.'}
              </p>
            </div>

            <div className="border-x border-b border-[#cfc4c5] bg-[#f5f2eb] p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">
                    Trợ lý thông minh AuraFit
                  </p>
                  <h3 className="mt-1 font-serif text-lg text-black">Chọn trải nghiệm dành cho bạn</h3>
                </div>
                <p className="text-xs text-[#777777]">Nhanh chóng · Cá nhân hóa · Dễ sử dụng</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  ref={tryOnBtnRef}
                  type="button"
                  onClick={() => tryOnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="group relative min-h-44 overflow-hidden border border-[#c8b378] bg-gradient-to-br from-[#fffdf7] via-[#f8f0d9] to-[#ead9aa] p-5 text-left shadow-[0_8px_24px_rgba(127,112,65,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#99854e] hover:shadow-[0_16px_32px_rgba(127,112,65,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#99854e] focus-visible:ring-offset-2"
                >
                  <span className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full border border-white/60 bg-white/25 transition-transform duration-500 group-hover:scale-125" />
                  <span className="relative flex h-full flex-col justify-between gap-5">
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#99854e] text-white shadow-lg shadow-[#99854e]/20">
                        <span className="material-symbols-outlined text-[23px]">apparel</span>
                      </span>
                      <span className="border border-[#99854e]/30 bg-white/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7f7041] backdrop-blur-sm">
                        AI Powered
                      </span>
                    </span>
                    <span>
                      <span className="block font-serif text-xl text-[#2d291f]">AI Virtual Try-On</span>
                      <span className="mt-1 block text-xs leading-5 text-[#665d49]">
                        Tải ảnh và xem trước trang phục trên chính bạn chỉ trong vài bước.
                      </span>
                      <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
                        Thử đồ ngay
                        <span className="material-symbols-outlined text-[17px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                      </span>
                    </span>
                  </span>
                </button>

                <button
                  ref={chatBtnRef}
                  type="button"
                  onClick={() => onNavigate?.('chat', product)}
                  className="group relative min-h-44 overflow-hidden border border-black bg-gradient-to-br from-[#181818] via-[#24221e] to-[#4a402b] p-5 text-left text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-[#7f7041] hover:shadow-[0_16px_32px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <span className="pointer-events-none absolute -bottom-14 -right-8 size-40 rounded-full border border-white/10 bg-white/5 transition-transform duration-500 group-hover:scale-125" />
                  <span className="relative flex h-full flex-col justify-between gap-5">
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#ead9aa] backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[23px]">forum</span>
                      </span>
                      <span className="border border-white/20 bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f3e7c7] backdrop-blur-sm">
                        Tư vấn 24/7
                      </span>
                    </span>
                    <span>
                      <span className="block font-serif text-xl">Chatbot tư vấn</span>
                      <span className="mt-1 block text-xs leading-5 text-white/65">
                        Nhận gợi ý phối đồ, kích cỡ và dịp sử dụng phù hợp với bạn.
                      </span>
                      <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ead9aa]">
                        Bắt đầu trò chuyện
                        <span className="material-symbols-outlined text-[17px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {product && (
          <div
            ref={tryOnRef}
            id="try-on-section"
            className="mt-6 overflow-hidden border border-[#cfc4c5] bg-white"
          >
            <div className="flex items-center gap-3 border-b border-[#eee] px-6 py-4">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                style={{ background: '#99854e' }}
              >
                <span className="material-symbols-outlined text-[20px]">apparel</span>
              </span>
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]">AI Virtual Try-On</h2>
                <p className="text-xs text-gray-500">
                  Tải ảnh của bạn để xem trước khi mặc thử trang phục này
                </p>
              </div>
            </div>
            <div className="p-6">
              <TryOnPanel
                productId={product.id}
                productName={product.name || product.title || 'Costume'}
                productImageUrl={getCostumeImage(product)}
              />
            </div>
          </div>
        )}

        {product && (
          <ProductReviewsSection
            reviews={reviews}
            summary={reviewSummary}
            page={reviewPage}
            totalPages={reviewTotalPages}
            totalElements={reviewTotalElements}
            ratingFilter={reviewRatingFilter}
            isLoading={isReviewsLoading}
            error={reviewError}
            successMessage={reviewSuccess}
            showReviewForm={showReviewForm}
            newReviewData={newReviewData}
            eligibleRentalDetails={eligibleRentalDetails}
            isEligibleRentalLoading={isEligibleRentalLoading}
            isMutating={isReviewMutating}
            onFilterRatingChange={handleReviewFilterChange}
            onPageChange={setReviewPage}
            onToggleReviewForm={handleToggleReviewForm}
            onReviewDataChange={setNewReviewData}
            onSubmitReview={handleSubmitReview}
            onUpdateReview={handleUpdateReview}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {(isRelatedLoading || relatedProducts.length > 0) && (
          <section className="mt-12 border-t border-[#cfc4c5] pt-10">
            <h2 className="mb-8 font-serif text-3xl font-normal text-[#1a1c1c] sm:text-4xl">
              Sản phẩm liên quan
            </h2>

            {isRelatedLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="overflow-hidden border border-[#cfc4c5] bg-white">
                    <div className="h-64 animate-pulse bg-[#f1eceb]" />
                    <div className="space-y-4 p-5">
                      <div className="h-5 w-3/4 animate-pulse bg-[#ece7e6]" />
                      <div className="h-4 w-1/2 animate-pulse bg-[#f1eceb]" />
                      <div className="h-11 animate-pulse bg-[#ece7e6]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((costume) => (
                  <CatalogProductCard key={costume.id} costume={costume} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </section>
        )}
        </div>

        <aside className="hidden min-h-0 self-stretch xl:block" aria-label="Sự kiện nổi bật bên phải">
          {rightEvent && <EventSideBanner side="right" event={rightEvent} />}
        </aside>
      </div>
    </div>
  );
}
