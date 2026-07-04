import { useEffect, useMemo, useState } from 'react';
import { fetchCostumes } from '../services/costumeService';
import { mapCostumeToProduct } from '../utils/productMapper';

const categoryPathByKey = {
  cosplay: 'cosplay',
  event: 'su-kien',
  events: 'su-kien',
  yearbook: 'ky-yeu',
  traditional: 'trang-phuc-truyen-thong',
  accessories: 'phu-kien',
};

function normalizeOptions(options) {
  if (typeof options === 'string') {
    return { categoryKey: options };
  }

  if (options && typeof options === 'object') {
    return options;
  }

  return {};
}

export function useCatalogCostumes(options) {
  const normalizedOptions = normalizeOptions(options);
  const {
    categoryKey,
    categoryPath: explicitCategoryPath,
    keyword,
  } = normalizedOptions;

  const resolvedCategoryPath = explicitCategoryPath || (categoryKey ? categoryPathByKey[categoryKey] || null : null);
  const normalizedKeyword = keyword?.trim() || '';

  const [state, setState] = useState({
    costumes: [],
    isLoading: false,
    error: null,
    requestKey: null,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestKey = JSON.stringify({
      categoryPath: resolvedCategoryPath || null,
      keyword: normalizedKeyword || null,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
      requestKey,
    }));

    const fetchData = async () => {
      try {
        const data = await fetchCostumes({
          categoryPath: resolvedCategoryPath,
          keyword: normalizedKeyword || undefined,
          pageSize: 100,
          signal: controller.signal,
        });

        if (controller.signal.aborted || !isMounted) return;

        setState({
          costumes: Array.isArray(data) ? data.map(mapCostumeToProduct) : [],
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
  }, [normalizedKeyword, resolvedCategoryPath]);

  return useMemo(() => {
    const requestKey = JSON.stringify({
      categoryPath: resolvedCategoryPath || null,
      keyword: normalizedKeyword || null,
    });
    const isCurrentRequest = state.requestKey === requestKey;

    return {
      costumes: isCurrentRequest ? state.costumes : [],
      isLoading: !isCurrentRequest || state.isLoading,
      error: isCurrentRequest ? state.error : null,
    };
  }, [normalizedKeyword, resolvedCategoryPath, state]);
}
