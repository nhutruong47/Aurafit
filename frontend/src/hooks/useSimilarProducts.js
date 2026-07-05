import { useEffect, useState } from 'react';
import { fetchSimilarCostumes } from '../services/costumeService';

const SIMILAR_LIMIT = 4;

export function useSimilarProducts(costumeId) {
  const [state, setState] = useState({
    recommendations: [],
    isLoading: !!costumeId,
    error: '',
    prevCostumeId: costumeId,
  });

  // Derived state to avoid setting state synchronously in useEffect
  if (costumeId !== state.prevCostumeId) {
    setState({
      recommendations: [],
      isLoading: !!costumeId,
      error: '',
      prevCostumeId: costumeId,
    });
  }

  useEffect(() => {
    if (!costumeId) return undefined;

    let isMounted = true;

    fetchSimilarCostumes(costumeId, SIMILAR_LIMIT)
      .then((items) => {
        if (!isMounted) return;

        const normalizedItems = Array.isArray(items)
          ? items
              .filter((item) => item?.costume?.id)
              .map((item) => ({
                ...item,
                costume: item.costume,
              }))
          : [];

        setState((prev) => ({
          ...prev,
          recommendations: normalizedItems,
          isLoading: false,
          error: '',
        }));
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          recommendations: [],
          isLoading: false,
          error: requestError.message || 'Không thể tải sản phẩm tương tự.',
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [costumeId]);

  return {
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    error: state.error,
  };
}
