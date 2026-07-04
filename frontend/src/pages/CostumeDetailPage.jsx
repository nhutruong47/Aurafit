import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductHero from '../components/product/ProductHero';
import SimilarProductsSection from '../components/product/SimilarProductsSection';
import AlertMessage from '../components/ui/AlertMessage';
import { useSimilarProducts } from '../hooks/useSimilarProducts';
import { fetchCostumeById } from '../services/costumeService';
import { logUserInteraction } from '../services/interactionsService';
import { mapCostumeToProduct, toCartItem } from '../utils/productMapper';

export default function CostumeDetailPage({ onAddToCart, onRentNow, onNavigate, currentUser }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const impressionKeyRef = useRef('');

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
        const mappedProduct = costume ? mapCostumeToProduct(costume) : null;
        setProduct(mappedProduct);
        if (mappedProduct?.items?.length > 0) {
          setSelectedItem(mappedProduct.items[0]);
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

  const handleAddToCartClick = async (itemFromHero) => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return false;
    }

    if (!selectedItem && product?.items?.length > 0) {
      alert('Vui lòng chọn kích thước/loại trước khi thêm vào giỏ.');
      return false;
    }

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
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          isLoading={isLoading}
          onAddToCart={handleAddToCartClick}
          onRentNow={handleRentNowClick}
          onNavigate={onNavigate}
          rentalStartDate={rentalStartDate}
          rentalEndDate={rentalEndDate}
          onStartDateChange={setRentalStartDate}
          onEndDateChange={setRentalEndDate}
        />

        {product && (
          <SimilarProductsSection
            recommendations={similarRecommendations}
            isLoading={isSimilarLoading}
            error={similarError}
            onNavigate={onNavigate}
            onAddToCart={onAddToCart}
            onRecommendationClick={handleRecommendationClick}
          />
        )}
      </div>
    </div>
  );
}
