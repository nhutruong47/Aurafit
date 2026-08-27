import { useEffect, useState } from 'react';
import { apiClient } from '../../services/http/apiClient';

export default function AdBanners() {
  const [leftAds, setLeftAds] = useState([]);
  const [rightAds, setRightAds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveAds = async () => {
      try {
        const response = await apiClient.get('/public/advertisements/active');
        const ads = response.data;
        if (!isMounted) return;

        // Backend already sorts by displayOrder asc
        const activeLeftAds = ads.filter((ad) => ad.position === 'LEFT');
        const activeRightAds = ads.filter((ad) => ad.position === 'RIGHT');
        
        setLeftAds(activeLeftAds);
        setRightAds(activeRightAds);
      } catch (error) {
        console.error('Failed to fetch ad banners:', error);
      }
    };
    fetchActiveAds();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 hidden md:block">
      {/* Left Ads Stack */}
      <div className="pointer-events-auto sticky left-4 top-[120px] mt-[20vh] float-left w-[120px] lg:w-[150px] xl:w-[180px] 2xl:w-[220px] flex flex-col gap-4">
        {leftAds.map((ad) => (
          <a
            key={ad.id}
            href={ad.targetUrl || '#'}
            target={ad.targetUrl ? '_blank' : '_self'}
            rel="noreferrer"
            className="group block overflow-hidden shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl bg-white border border-[#eaeaea]"
          >
            <div className="w-full bg-[#f4f4f2]">
              <img 
                src={ad.imageUrl} 
                alt={ad.name} 
                className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105" 
              />
            </div>
            {ad.description && (
              <div className="p-3 bg-white text-center border-t border-[#eaeaea]">
                <p className="text-xs text-[#555] leading-relaxed line-clamp-3">{ad.description}</p>
              </div>
            )}
          </a>
        ))}
      </div>
      
      {/* Right Ads Stack */}
      <div className="pointer-events-auto sticky right-4 top-[120px] mt-[20vh] float-right w-[120px] lg:w-[150px] xl:w-[180px] 2xl:w-[220px] flex flex-col gap-4">
        {rightAds.map((ad) => (
          <a
            key={ad.id}
            href={ad.targetUrl || '#'}
            target={ad.targetUrl ? '_blank' : '_self'}
            rel="noreferrer"
            className="group block overflow-hidden shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl bg-white border border-[#eaeaea]"
          >
            <div className="w-full bg-[#f4f4f2]">
              <img 
                src={ad.imageUrl} 
                alt={ad.name} 
                className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105" 
              />
            </div>
            {ad.description && (
              <div className="p-3 bg-white text-center border-t border-[#eaeaea]">
                <p className="text-xs text-[#555] leading-relaxed line-clamp-3">{ad.description}</p>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
