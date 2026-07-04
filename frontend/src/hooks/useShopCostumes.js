import { useCallback, useEffect, useMemo, useState } from 'react';
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

  // Recommended & Trending: client-side paged (small datasets)
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  // All: DB-level paginated
  const [allProducts, setAllProducts] = useState([]);
  const [allTotalPages, setAllTotalPages] = useState(1);
  const [allTotalElements, setAllTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedUserKey, setLoadedUserKey] = useState(null);

  // Load Recommended & Trending on mount (small datasets, one-shot)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestKey = currentUserId || '__guest__';
    setIsLoading(true);
    setError('');

    Promise.all([
      fetchRecommendedCostumes(currentUserId),
      fetchSeasonalCostumes(),
    ])
      .then(([recommendedData, seasonalData]) => {
        if (controller.signal.aborted || !isMounted) return;
        setRecommendedProducts(uniqueProducts((recommendedData || []).map(mapCostumeToProduct)));
        setTrendingProducts(uniqueProducts((seasonalData || []).map(mapCostumeToProduct)));
        setLoadedUserKey(requestKey);
        setIsLoading(false);
      })
      .catch((requestError) => {
        if (controller.signal.aborted || !isMounted) return;
        setError(requestError.message || 'Không thể tải dữ liệu shop chung.');
        setIsLoading(false);
        setLoadedUserKey(requestKey);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentUserId]);

  // DB-level pagination: fetch "All" tab data when its page changes
  const allPage = pageByTab.all || 1;
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    fetchCostumes({ pageNo: allPage - 1, pageSize: PAGE_SIZE, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted || !isMounted) return;
        setAllProducts(uniqueProducts((result.data || []).map(mapCostumeToProduct)));
        setAllTotalPages(result.totalPages || 1);
        setAllTotalElements(result.totalElements || 0);
        setIsLoading(false);
      })
      .catch((requestError) => {
        if (controller.signal.aborted || !isMounted) return;
        setError(requestError.message || 'Không thể tải dữ liệu sản phẩm.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [allPage]);

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

  // For "all" tab: totalPages comes from DB. For others: client-side calc.
  const totalPages =
    activeTab === 'all'
      ? allTotalPages
      : Math.max(1, Math.ceil(activeProducts.length / PAGE_SIZE));

  // For "all" tab: products are already the correct page slice from the DB.
  // For other tabs: client-side slicing.
  const visibleProducts =
    activeTab === 'all'
      ? activeProducts
      : activeProducts.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const totalElements =
    activeTab === 'all' ? allTotalElements : activeProducts.length;

  const requestKey = currentUserId || '__guest__';
  const isCurrentRequest = loadedUserKey === requestKey;

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setPageByTab((currentPages) => ({
      ...currentPages,
      [tabId]: currentPages[tabId] || 1,
    }));
  }, []);

  const setActivePage = useCallback((page) => {
    setPageByTab((currentPages) => ({
      ...currentPages,
      [activeTab]: Math.max(page, 1),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return {
    activeTab,
    productsByTab,
    activeProducts,
    activePage,
    totalPages,
    totalElements,
    allTotalElements,
    visibleProducts,
    isLoading: !isCurrentRequest || isLoading,
    error: isCurrentRequest ? error : '',
    handleTabChange,
    setActivePage,
  };
}
