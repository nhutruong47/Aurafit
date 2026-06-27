import { useEffect, useState } from 'react';
import { fetchSimilarCostumes } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';

const SIMILAR_LIMIT = 4;

export function useSimilarProducts(costumeId) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!costumeId) {
      setRecommendations([]);
      setIsLoading(false);
      setError('');
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchSimilarCostumes(costumeId, SIMILAR_LIMIT)
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
        setError('');
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setRecommendations([]);
        setError(requestError.message || 'Không thể tải sản phẩm tương tự.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [costumeId]);

  return {
    recommendations,
    isLoading,
    error,
  };
}
