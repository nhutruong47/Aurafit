import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes } from '../services/api';
import { categoryApiNames, mapCostumeToProduct } from '../utils/productMapper';

export function useCostumes(categoryKey) {
  const [costumes, setCostumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const category = categoryKey ? categoryApiNames[categoryKey] || categoryKey : undefined;

    setIsLoading(true);
    setError(null);

    fetchCostumes(category)
      .then((data) => {
        if (isMounted) {
          setCostumes(Array.isArray(data) ? data.map(mapCostumeToProduct) : []);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError);
          setCostumes([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryKey]);

  return useMemo(() => ({ costumes, isLoading, error }), [costumes, error, isLoading]);
}
