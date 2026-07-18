import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import ProductHero from '../components/product/ProductHero';
import AlertMessage from '../components/ui/AlertMessage';
import { fetchCostumeById, fetchRelatedCostumes } from '../services/costumeService';
import { logUserInteraction } from '../services/interactionsService';
import { getCostumeApiCategoryName, toCartItemFromCostume } from '../utils/costumeUtils';

export default function CostumeDetailPage({ onAddToCart, onRentNow, onNavigate, currentUser }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);

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

  if (!product && !isLoading && !loadError) {
    return null;
  }

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
          </div>
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
    </div>
  );
}
