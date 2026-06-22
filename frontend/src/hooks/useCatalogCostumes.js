import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes } from '../services/costumeService';
import { categoryApiNames, mapCostumeToProduct } from '../utils/productMapper';

export function useCatalogCostumes(categoryKey) {
  const [state, setState] = useState({
    costumes: [],
    isLoading: false,
    error: null,
    requestKey: null,
  });

  useEffect(() => {
    let isMounted = true;
    const requestKey = categoryKey || '__all__';
    const resolvedCategory = categoryKey ? categoryApiNames[categoryKey] || categoryKey : null;

    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
      requestKey,
    }));

    fetchCostumes({ pageSize: 100 })
      .then((data) => {
        if (!isMounted) return;

        const mappedCostumes = Array.isArray(data) ? data.map(mapCostumeToProduct) : [];
        const filteredCostumes = resolvedCategory
          ? mappedCostumes.filter(
              (product) => product.rawCategory === resolvedCategory || product.category === resolvedCategory
            )
          : mappedCostumes;

        setState({
          costumes: filteredCostumes,
          isLoading: false,
          error: null,
          requestKey,
        });
      })
      .catch((requestError) => {
        if (!isMounted) return;

        setState({
          costumes: [],
          isLoading: false,
          error: requestError,
          requestKey,
        });
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
