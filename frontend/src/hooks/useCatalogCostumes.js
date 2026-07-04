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

function normalizeOptions(optionsOrCategoryParam, sortBy, sortDir, keyword, pageSize) {
  if (optionsOrCategoryParam && typeof optionsOrCategoryParam === 'object' && !Array.isArray(optionsOrCategoryParam)) {
    return {
      sortBy: 'id',
      sortDir: 'desc',
      keyword: '',
      pageSize: 20,
      ...optionsOrCategoryParam,
    };
  }

  if (typeof optionsOrCategoryParam === 'number') {
    return {
      categoryId: optionsOrCategoryParam,
      sortBy,
      sortDir,
      keyword,
      pageSize,
    };
  }

  if (typeof optionsOrCategoryParam === 'string' && optionsOrCategoryParam.trim()) {
    return {
      categoryKey: optionsOrCategoryParam.trim(),
      sortBy,
      sortDir,
      keyword,
      pageSize,
    };
  }

  return {
    sortBy,
    sortDir,
    keyword,
    pageSize,
  };
}

function resolveCategoryPath(categoryKey, explicitCategoryPath) {
  if (explicitCategoryPath && typeof explicitCategoryPath === 'string') {
    const normalizedPath = explicitCategoryPath.trim().toLowerCase();
    return normalizedPath || null;
  }

  if (!categoryKey || typeof categoryKey !== 'string') {
    return null;
  }

  const normalizedKey = categoryKey.trim().toLowerCase();
  return categoryPathByKey[normalizedKey] || normalizedKey || null;
}

export function useCatalogCostumes(
  optionsOrCategoryParam = null,
  sortByArg = 'id',
  sortDirArg = 'desc',
  keywordArg = '',
  pageSizeArg = 20
) {
  const normalizedOptions = useMemo(
    () => normalizeOptions(optionsOrCategoryParam, sortByArg, sortDirArg, keywordArg, pageSizeArg),
    [keywordArg, optionsOrCategoryParam, pageSizeArg, sortByArg, sortDirArg]
  );

  const {
    categoryId = null,
    categoryKey = null,
    categoryPath: explicitCategoryPath = null,
    keyword = '',
    sortBy = 'id',
    sortDir = 'desc',
    pageSize = 20,
  } = normalizedOptions;

  const resolvedCategoryPath = resolveCategoryPath(categoryKey, explicitCategoryPath);
  const normalizedKeyword = keyword?.trim() || '';

  const [activePage, setActivePage] = useState(1);
  const [state, setState] = useState({
    costumes: [],
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    error: null,
    requestKey: null,
  });

  useEffect(() => {
    setActivePage(1);
  }, [categoryId, normalizedKeyword, pageSize, resolvedCategoryPath, sortBy, sortDir]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestKey = JSON.stringify({
      activePage,
      categoryId: categoryId || null,
      categoryPath: resolvedCategoryPath || null,
      keyword: normalizedKeyword || null,
      pageSize,
      sortBy,
      sortDir,
    });

    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
      requestKey,
    }));

    const fetchData = async () => {
      try {
        const data = await fetchCostumes({
          categoryId,
          categoryPath: resolvedCategoryPath,
          keyword: normalizedKeyword || undefined,
          sortBy,
          sortDir,
          pageNo: Math.max(activePage - 1, 0),
          pageSize,
          signal: controller.signal,
        });

        if (controller.signal.aborted || !isMounted) {
          return;
        }

        const actualData = Array.isArray(data) ? data : data?.data || [];
        const totalPages = Math.max(1, Number(data?.totalPages || 1));
        const totalElements = Number(data?.totalElements ?? actualData.length);
        const currentPage = Number(data?.currentPage ?? Math.max(activePage - 1, 0)) + 1;

        setState({
          costumes: actualData.map(mapCostumeToProduct),
          totalPages,
          totalElements,
          isLoading: false,
          error: null,
          requestKey,
        });

        if (currentPage !== activePage) {
          setActivePage(currentPage);
        }
      } catch (requestError) {
        if (controller.signal.aborted || !isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          costumes: [],
          totalPages: 1,
          totalElements: 0,
          isLoading: false,
          error: requestError,
          requestKey,
        }));
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activePage, categoryId, normalizedKeyword, pageSize, resolvedCategoryPath, sortBy, sortDir]);

  return useMemo(() => {
    const requestKey = JSON.stringify({
      activePage,
      categoryId: categoryId || null,
      categoryPath: resolvedCategoryPath || null,
      keyword: normalizedKeyword || null,
      pageSize,
      sortBy,
      sortDir,
    });
    const isCurrentRequest = state.requestKey === requestKey;

    return {
      costumes: isCurrentRequest ? state.costumes : [],
      totalPages: isCurrentRequest ? state.totalPages : 1,
      totalElements: isCurrentRequest ? state.totalElements : 0,
      activePage,
      setActivePage,
      isLoading: !isCurrentRequest || state.isLoading,
      error: isCurrentRequest ? state.error : null,
    };
  }, [
    activePage,
    categoryId,
    normalizedKeyword,
    pageSize,
    resolvedCategoryPath,
    sortBy,
    sortDir,
    state,
  ]);
}
