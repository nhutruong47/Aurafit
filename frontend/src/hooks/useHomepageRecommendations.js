import { useEffect, useState } from 'react';
import { fetchHomepageRecommendations, fetchRecommendedCostumes } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';

const HOMEPAGE_LIMIT = 6;

const normalizePersonalizedItems = (items) =>
  Array.isArray(items)
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

const normalizeFallbackItems = (items) =>
  Array.isArray(items)
    ? items
        .filter((item) => item?.id)
        .map((item) => ({
          product: mapCostumeToProduct({
            ...item,
            available: true,
          }),
        }))
    : [];

export function useHomepageRecommendations(sessionId, currentUserId) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      setIsLoading(true);
      setError('');

      try {
        const personalizedItems = await fetchHomepageRecommendations({
          sessionId,
          limit: HOMEPAGE_LIMIT,
        });

        if (!isMounted) return;

        const normalizedPersonalizedItems = normalizePersonalizedItems(personalizedItems);

        if (normalizedPersonalizedItems.length > 0) {
          setRecommendations(normalizedPersonalizedItems);
          setError('');
          return;
        }

        try {
          const fallbackItems = await fetchRecommendedCostumes(currentUserId);
          if (!isMounted) return;

          setRecommendations(normalizeFallbackItems(fallbackItems));
          setError('');
        } catch {
          if (!isMounted) return;

          setRecommendations([]);
          setError('');
        }
      } catch (personalizedError) {
        try {
          const fallbackItems = await fetchRecommendedCostumes(currentUserId);
          if (!isMounted) return;

          setRecommendations(normalizeFallbackItems(fallbackItems));
          setError('');
        } catch (fallbackError) {
          if (!isMounted) return;

          setRecommendations([]);
          setError(
            fallbackError.message || personalizedError.message || 'Không thể tải gợi ý trang chủ.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecommendations();

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
