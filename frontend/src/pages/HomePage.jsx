import { useEffect, useMemo, useRef, useState } from 'react';
import HomeCategoryMosaic from '../components/home/HomeCategoryMosaic';
import HomeFeaturedSection from '../components/home/HomeFeaturedSection';
import HomeHero from '../components/home/HomeHero';
import HomeInsiderSection from '../components/home/HomeInsiderSection';
import HomePersonalizedSection from '../components/home/HomePersonalizedSection';
import HomeServicesSection from '../components/home/HomeServicesSection';
import HomeStyleSlider from '../components/home/HomeStyleSlider';
import HomeTrendingSection from '../components/home/HomeTrendingSection';
import HomeTrustSection from '../components/home/HomeTrustSection';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { fetchRecommendedCostumes, fetchSeasonalCostumes } from '../services/costumeService';
import { logUserInteraction } from '../services/interactionsService';
import { mapCostumeToProduct } from '../utils/productMapper';

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }

    seen.add(product.id);
    return true;
  });
}

export default function HomePage({ currentUser, onNavigate, onAddToCart }) {
  const [activeTab, setActiveTab] = useState('event');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const sliderRef = useRef(null);
  const homepageImpressionKeyRef = useRef('');
  const { costumes, isLoading } = useCatalogCostumes();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [isShopHighlightsLoading, setIsShopHighlightsLoading] = useState(false);
  const [shopHighlightsError, setShopHighlightsError] = useState('');

  const products = useMemo(
    () => ({
      event: costumes.filter((product) => product.rootCategoryKey === 'events').slice(0, 4),
      cosplay: costumes.filter((product) => product.rootCategoryKey === 'cosplay').slice(0, 4),
      yearbook: costumes.filter((product) => product.rootCategoryKey === 'yearbook').slice(0, 4),
      accessories: costumes.filter((product) => product.rootCategoryKey === 'accessories').slice(0, 4),
    }),
    [costumes]
  );

  useEffect(() => {
    let isMounted = true;

    setIsShopHighlightsLoading(true);
    setShopHighlightsError('');

    Promise.all([fetchRecommendedCostumes(currentUser?.id), fetchSeasonalCostumes()])
      .then(([recommendedData, seasonalData]) => {
        if (!isMounted) {
          return;
        }

        setRecommendedProducts(uniqueProducts((recommendedData || []).map(mapCostumeToProduct)));
        setTrendingProducts(uniqueProducts((seasonalData || []).map(mapCostumeToProduct)));
        setShopHighlightsError('');
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setRecommendedProducts([]);
        setTrendingProducts([]);
        setShopHighlightsError(requestError.message || 'Không thể tải đề xuất và xu hướng từ shop.');
      })
      .finally(() => {
        if (isMounted) {
          setIsShopHighlightsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const homepageRecommendations = useMemo(
    () =>
      recommendedProducts.map((product, index) => ({
        product,
        reason: index === 0 ? 'Đề xuất từ shop' : 'Dành cho bạn',
      })),
    [recommendedProducts]
  );

  useEffect(() => {
    if (!homepageRecommendations.length) return;

    const recommendedIds = homepageRecommendations
      .map((item) => item?.product?.id)
      .filter((id) => id !== undefined && id !== null);
    const impressionKey = `home:${recommendedIds.join(',')}:${currentUser?.id || 'guest'}`;

    if (!recommendedIds.length || homepageImpressionKeyRef.current === impressionKey) {
      return;
    }

    homepageImpressionKeyRef.current = impressionKey;

    logUserInteraction({
      eventType: 'RECOMMENDATION_IMPRESSION',
      targetType: 'HOMEPAGE',
      metadata: {
        slot: 'homepage_personalized',
        recommendedCostumeIds: recommendedIds,
        userType: currentUser?.id ? 'authenticated' : 'guest',
      },
    }).catch(() => {});
  }, [currentUser?.id, homepageRecommendations]);

  const scrollSlider = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const amount = slider.clientWidth * 0.82;
    slider.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (email) setIsSubscribed(true);
  };

  const handleCopyVoucher = (event) => {
    navigator.clipboard.writeText('AURA20WELCOME');
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>Đã sao chép';
    window.setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  };

  const handleHomepageRecommendationClick = (recommendation, index, page, product) => {
    if (page !== 'productDetail' || !product?.id) {
      return;
    }

    logUserInteraction({
      eventType: 'RECOMMENDATION_CLICK',
      targetType: 'RECOMMENDATION',
      targetId: product.id,
      metadata: {
        slot: 'homepage_personalized',
        recommendedCostumeId: product.id,
        reason: recommendation?.reason || null,
        position: index + 1,
        userType: currentUser?.id ? 'authenticated' : 'guest',
      },
    }).catch(() => {});
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <HomeHero onNavigate={onNavigate} />
      <HomeServicesSection />
      <HomePersonalizedSection
        recommendations={homepageRecommendations}
        isLoading={isShopHighlightsLoading}
        error={shopHighlightsError}
        onNavigate={onNavigate}
        onRecommendationClick={handleHomepageRecommendationClick}
      />
      <HomeCategoryMosaic onNavigate={onNavigate} />
      <HomeStyleSlider sliderRef={sliderRef} onNavigate={onNavigate} onScroll={scrollSlider} />
      <HomeFeaturedSection
        activeTab={activeTab}
        isLoading={isLoading}
        products={products}
        onSetActiveTab={setActiveTab}
        onAddToCart={onAddToCart}
        onNavigate={onNavigate}
      />
      <HomeTrustSection />
      <HomeTrendingSection
        trending={trendingProducts}
        isLoading={isShopHighlightsLoading}
        error={shopHighlightsError}
        onNavigate={onNavigate}
      />
      <HomeInsiderSection
        email={email}
        isSubscribed={isSubscribed}
        onEmailChange={setEmail}
        onSubscribe={handleSubscribe}
        onCopyVoucher={handleCopyVoucher}
        onScrollTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
