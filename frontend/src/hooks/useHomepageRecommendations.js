import { useEffect, useState } from 'react';
import { fetchHomepageRecommendations } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';

const HOMEPAGE_LIMIT = 6;

export function useHomepageRecommendations(sessionId, currentUserId) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchHomepageRecommendations(sessionId, HOMEPAGE_LIMIT)
      .then((items) => {
        if (!isMounted) return;

        const normalizedItems = Array.isArray(items)
          ? items
              .filter((item) => item?.costume?.id)
              .map((item) => ({
                ...item,
                product: mapCostumeToProduct({
                  ...item.costume,
                  available: item.availableItemCount > 0,
                }),
              }))
          : [];

        setRecommendations(normalizedItems);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setRecommendations([]);
        setError(requestError.message || 'Không thể tải gợi ý trang chủ.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, sessionId]);

  return {
    recommendations,
    isLoading,
    error,
  };
}
