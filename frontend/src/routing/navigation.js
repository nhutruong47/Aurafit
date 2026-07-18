import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const pagePathMap = {
  home: '/',
  catalog: '/catalog',
  checkout: '/checkout',
  'direct-rental': '/direct-rental',
  payment: '/payment',
  success: '/success',
  orders: '/orders',
  adminDashboard: '/admin',
  staffDashboard: '/staff',
  yearbook: '/yearbook',
  cosplay: '/cosplay',
  events: '/events',
  traditional: '/traditional',
  care: '/care',
  account: '/account',
};

export function getCurrentPageFromPath(pathname) {
  if (pathname === '/' || pathname === '') {
    return 'home';
  }

  if (pathname.startsWith('/products/')) {
    return 'productDetail';
  }

  if (pathname === '/direct-rental') {
    return 'directRental';
  }

  const match = Object.entries(pagePathMap).find(([, path]) => path === pathname);
  return match?.[0] || 'home';
}

export function useLegacyNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (page, data = null, options = {}) => {
      if (page === 'productDetail') {
        const productId = data?.id;

        if (productId === undefined || productId === null) {
          navigate(pagePathMap.catalog, options);
          return;
        }

        navigate(`/products/${encodeURIComponent(productId)}`, {
          ...options,
          state: { product: data },
        });
        return;
      }

      if (page === 'catalog' && data && typeof data === 'object') {
        const params = new URLSearchParams();
        if (data.categoryPath) {
          params.set('categoryPath', data.categoryPath);
        }
        if (data.categoryId !== undefined && data.categoryId !== null) {
          params.set('categoryId', String(data.categoryId));
        }
        if (data.keyword) {
          params.set('keyword', data.keyword);
        }

        navigate(
          params.toString() ? `${pagePathMap.catalog}?${params.toString()}` : pagePathMap.catalog,
          options
        );
        return;
      }

      if (['shopDetail', 'becomeLessor'].includes(page)) {
        navigate(pagePathMap.catalog, options);
        return;
      }

      navigate(pagePathMap[page] || pagePathMap.home, options);
    },
    [navigate]
  );
}

export function useSearchNavigation() {
  const navigate = useNavigate();

  return useCallback(() => {
    navigate(`/catalog?focus=search&t=${Date.now()}`);
  }, [navigate]);
}
