import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes } from '../services/costumesService';
import { categoryApiNames, mapCostumeToProduct } from '../utils/productMapper';

export function useCostumes(categoryKey) {
  const [state, setState] = useState({
    costumes: [],
    isLoading: false,
    error: null,
    requestKey: null,
  });

  useEffect(() => {
    let isMounted = true;
    const category = categoryKey ? categoryApiNames[categoryKey] || categoryKey : undefined;
    const requestKey = categoryKey || '__all__';

    fetchCostumes(category)
      .then((data) => {
        if (isMounted) {
          setState({
            costumes: Array.isArray(data) ? data.map(mapCostumeToProduct) : [],
            isLoading: false,
            error: null,
            requestKey,
          });
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setState({
            costumes: [],
            isLoading: false,
            error: requestError,
            requestKey,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryKey]);

  return useMemo(() => {
    const requestKey = categoryKey || '__all__';
    const isCurrentRequest = state.requestKey === requestKey;

    return {
      costumes: isCurrentRequest ? state.costumes : [],
      isLoading: !isCurrentRequest || state.isLoading,
      error: isCurrentRequest ? state.error : null,
    };
  }, [categoryKey, state]);
}
