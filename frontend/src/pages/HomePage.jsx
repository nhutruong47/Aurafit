import { useEffect, useMemo, useRef, useState } from 'react';
import HomeCategoryMosaic from '../components/home/HomeCategoryMosaic';
import HomeFeaturedSection from '../components/home/HomeFeaturedSection';
import HomeHero from '../components/home/HomeHero';
import HomeInsiderSection from '../components/home/HomeInsiderSection';
import HomeServicesSection from '../components/home/HomeServicesSection';
import HomeStyleSlider from '../components/home/HomeStyleSlider';
import HomeTrendingSection from '../components/home/HomeTrendingSection';
import HomeTrustSection from '../components/home/HomeTrustSection';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { fetchSeasonalCostumes } from '../services/costumeService';
import { getCostumeRootCategory } from '../utils/costumeUtils';

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((costume) => {
    if (seen.has(costume.id)) {
      return false;
    }

    seen.add(costume.id);
    return true;
  });
}

export default function HomePage({ onNavigate, onAddToCart }) {
  const [activeTab, setActiveTab] = useState('event');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const sliderRef = useRef(null);
  const { costumes, isLoading } = useCatalogCostumes();
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState('');

  const products = useMemo(
    () => ({
      event: costumes.filter((costume) => getCostumeRootCategory(costume).key === 'events').slice(0, 4),
      cosplay: costumes.filter((costume) => getCostumeRootCategory(costume).key === 'cosplay').slice(0, 4),
      yearbook: costumes.filter((costume) => getCostumeRootCategory(costume).key === 'yearbook').slice(0, 4),
      accessories: costumes.filter((costume) => getCostumeRootCategory(costume).key === 'accessories').slice(0, 4),
    }),
    [costumes]
  );

  useEffect(() => {
    let isMounted = true;

    setIsTrendingLoading(true);
    setTrendingError('');

    fetchSeasonalCostumes()
      .then((seasonalData) => {
        if (!isMounted) {
          return;
        }

        setTrendingProducts(uniqueProducts(seasonalData || []));
        setTrendingError('');
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setTrendingProducts([]);
        setTrendingError(requestError.message || 'KhÃ´ng thá»ƒ táº£i xu hÆ°á»›ng tá»« shop.');
      })
      .finally(() => {
        if (isMounted) {
          setIsTrendingLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    button.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>ÄÃ£ sao chÃ©p';
    window.setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <HomeHero onNavigate={onNavigate} />
      <HomeServicesSection />
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
        isLoading={isTrendingLoading}
        error={trendingError}
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
