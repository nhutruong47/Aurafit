import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes, fetchRecommendedCostumes, fetchSeasonalCostumes } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';

const PAGE_SIZE = 20;

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export function useShopCostumes(currentUserId) {
  const [activeTab, setActiveTab] = useState('recommended');
  const [pageByTab, setPageByTab] = useState({ recommended: 1, trending: 1, all: 1 });
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedUserKey, setLoadedUserKey] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const requestKey = currentUserId || '__guest__';
    setIsLoading(true);
    setError('');

    Promise.all([
      fetchRecommendedCostumes(currentUserId),
      fetchSeasonalCostumes(),
      fetchCostumes({ pageSize: 100 }),
    ])
      .then(([recommendedData, seasonalData, allData]) => {
        if (!isMounted) return;

        setRecommendedProducts(uniqueProducts((recommendedData || []).map(mapCostumeToProduct)));
        setTrendingProducts(uniqueProducts((seasonalData || []).map(mapCostumeToProduct)));
        setAllProducts(uniqueProducts((allData || []).map(mapCostumeToProduct)));
        setError('');
        setIsLoading(false);
        setLoadedUserKey(requestKey);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Khong the tai du lieu shop chung.');
        setIsLoading(false);
        setLoadedUserKey(requestKey);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const productsByTab = useMemo(
    () => ({
      recommended: recommendedProducts,
      trending: trendingProducts,
      all: allProducts,
    }),
    [allProducts, recommendedProducts, trendingProducts]
  );

  const activeProducts = productsByTab[activeTab] || [];
  const activePage = pageByTab[activeTab] || 1;
  const totalPages = Math.max(1, Math.ceil(activeProducts.length / PAGE_SIZE));
  const visibleProducts = activeProducts.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const requestKey = currentUserId || '__guest__';
  const isCurrentRequest = loadedUserKey === requestKey;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPageByTab((currentPages) => ({
      ...currentPages,
      [tabId]: currentPages[tabId] || 1,
    }));
  };

  const setActivePage = (page) => {
    setPageByTab((currentPages) => ({
      ...currentPages,
      [activeTab]: Math.min(Math.max(page, 1), totalPages),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    activeTab,
    productsByTab,
    activeProducts,
    activePage,
    totalPages,
    visibleProducts,
    isLoading: !isCurrentRequest || isLoading,
    error: isCurrentRequest ? error : '',
    handleTabChange,
    setActivePage,
  };
}
