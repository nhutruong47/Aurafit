import { useMemo, useRef, useState } from 'react';
import HomeCategoryMosaic from '../components/home/HomeCategoryMosaic';
import HomeFeaturedSection from '../components/home/HomeFeaturedSection';
import HomeHero from '../components/home/HomeHero';
import HomeInsiderSection from '../components/home/HomeInsiderSection';
import PersonalizedRecommendationSection from '../components/ai/PersonalizedRecommendationSection';
import HomeServicesSection from '../components/home/HomeServicesSection';
import HomeStyleSlider from '../components/home/HomeStyleSlider';
import HomeTrendingSection from '../components/home/HomeTrendingSection';
import HomeTrustSection from '../components/home/HomeTrustSection';
import { useAiRecommendations } from '../hooks/useAiRecommendations';
import { trackRecommendationClick } from '../services/interactionsService';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';

export default function HomePage({ currentUser, onNavigate, onAddToCart }) {
  const [activeTab, setActiveTab] = useState('event');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const sliderRef = useRef(null);
  const { costumes, isLoading } = useCatalogCostumes();
  const {
    personalized,
    isLoadingPersonalized,
  } = useAiRecommendations({
    autoLoadPersonalized: Boolean(currentUser?.id),
    personalizedLimit: 3,
    currentUserId: currentUser?.id,
  });

  const products = useMemo(
    () => ({
      event: costumes.filter((product) => product.rawCategory === 'Events').slice(0, 4),
      cosplay: costumes.filter((product) => product.rawCategory === 'Cosplay').slice(0, 4),
      yearbook: costumes.filter((product) => product.rawCategory === 'Yearbook').slice(0, 4),
      accessories: costumes.filter((product) => product.rawCategory === 'Accessories').slice(0, 4),
    }),
    [costumes]
  );
  const trending = useMemo(() => costumes.slice(0, 4), [costumes]);

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
    button.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>Đã copy';
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
      {currentUser?.id && (
        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-20">
          <PersonalizedRecommendationSection
            title="Ca nhan hoa cho ban"
            subtitle={personalized.profileSummary || 'AI dang uu tien cac san pham co metadata khop voi lich su duyet va hanh vi thue cua ban.'}
            items={personalized.items}
            isLoading={isLoadingPersonalized}
            onNavigate={onNavigate}
            onTrackClick={(item) =>
              trackRecommendationClick({
                productId: item.product.id,
                sourcePage: 'home',
                sourceModule: 'personalized-section',
                reason: item.reason,
              })
            }
          />
        </div>
      )}
      <HomeTrustSection />
      <HomeTrendingSection trending={trending} onNavigate={onNavigate} />
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
