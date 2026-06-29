import { useEffect, useState } from 'react';
import { fetchRecommendedCostumes } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';

export function useHomepageRecommendations(sessionId, currentUserId) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');

    // Update to hit the new backend API: /api/costumes/recommendations?userId={id}
    fetchRecommendedCostumes(currentUserId)
      .then((items) => {
        if (!isMounted) return;

        const normalizedItems = Array.isArray(items)
          ? items
              .filter((item) => item?.id)
              .map((item) => ({
                product: mapCostumeToProduct({
                  ...item,
                  available: true,
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
