import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes } from '../services/costumeService';
import { fetchPublicCategories } from '../services/catalogService';
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
    const controller = new AbortController();
    const requestKey = categoryKey || '__all__';
    const resolvedCategoryName = categoryKey ? categoryApiNames[categoryKey] || categoryKey : null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
      requestKey,
    }));

    const fetchData = async () => {
      try {
        let categoryId = null;

        // Step 1: If a category is requested, fetch all categories to find the corresponding ID
        if (resolvedCategoryName) {
          const categories = await fetchPublicCategories();
          if (controller.signal.aborted) return;
          
          const targetCategory = (categories || []).find(
            (c) => c.name.toLowerCase() === resolvedCategoryName.toLowerCase()
          );
          
          // If the category is specified but doesn't exactly match on backend, we just won't pass categoryId.
          // We will filter locally after mapping.
          if (targetCategory) {
            categoryId = targetCategory.id;
          }
        }

        // Step 2: Fetch costumes with the found categoryId (or null for all)
        const data = await fetchCostumes({ 
          categoryId, 
          pageSize: 100, 
          signal: controller.signal 
        });
        
        if (controller.signal.aborted || !isMounted) return;

        let mappedCostumes = Array.isArray(data) ? data.map(mapCostumeToProduct) : [];
        
        if (resolvedCategoryName) {
          mappedCostumes = mappedCostumes.filter(
            (c) => c.category.toLowerCase() === resolvedCategoryName.toLowerCase()
          );
        }

        setState({
          costumes: mappedCostumes,
          isLoading: false,
          error: null,
          requestKey,
        });
      } catch (requestError) {
        if (controller.signal.aborted || !isMounted) return;

        setState({
          costumes: [],
          isLoading: false,
          error: requestError,
          requestKey,
        });
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
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
