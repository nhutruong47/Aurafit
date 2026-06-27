import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const pagePathMap = {
  home: '/',
  catalog: '/catalog',
  shop: '/shop',
  checkout: '/checkout',
  'direct-rental': '/direct-rental',
  payment: '/payment',
  success: '/success',
  chat: '/chat',
  orders: '/orders',
  adminDashboard: '/admin',
  staffDashboard: '/staff',
  yearbook: '/yearbook',
  cosplay: '/cosplay',
  events: '/events',
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

      if (page === 'chat') {
        navigate(pagePathMap.chat, {
          ...options,
          state: data ? { contextProduct: data } : null,
        });
        return;
      }

      if (['shopDetail', 'becomeLessor', 'sellerDashboard'].includes(page)) {
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
