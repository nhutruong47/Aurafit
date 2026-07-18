import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import ProductHero from '../components/product/ProductHero';
import TryOnPanel from '../components/product/TryOnPanel';
import AlertMessage from '../components/ui/AlertMessage';
import { fetchCostumeById, fetchRelatedCostumes } from '../services/costumeService';
import { logUserInteraction } from '../services/interactionsService';
import {
  getCostumeApiCategoryName,
  getCostumeImage,
  toCartItemFromCostume,
} from '../utils/costumeUtils';

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
  const tryOnRef = useRef(null);

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

            <div className="flex flex-col justify-center gap-3 border border-[#cfc4c5] bg-white p-5">
              <button
                type="button"
                onClick={() => tryOnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="w-full border border-[#99854e] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#99854e] transition-all duration-300 hover:bg-[#99854e] hover:text-white"
              >
                AI Virtual Try-On
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('chat', product)}
                className="w-full border border-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all duration-300 hover:bg-black hover:text-white"
              >
                Chatbot tư vấn
              </button>
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
