import { useEffect, useState } from 'react';
import { fetchCostumes } from '../services/costumeService';
import { categoryApiNames, mapCostumeToProduct } from '../utils/productMapper';

export function useCatalogCostumes(categoryParam = null, sortBy = 'id', sortDir = 'desc', keyword = '', pageSize = 20) {
  const [activePage, setActivePage] = useState(0);
  
  // Reset page when any filter changes
  useEffect(() => {
    setActivePage(0);
  }, [categoryParam, sortBy, sortDir, keyword]);

  const [state, setState] = useState({
    costumes: [],
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    error: null,
    requestKey: null,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestKey = `${categoryParam}_${sortBy}_${sortDir}_${keyword}_${activePage}`;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
      requestKey,
    }));

    const fetchData = async () => {
      try {
        const isGroupedCategory = typeof categoryParam === 'string' && categoryParam !== '';
        
        let fetchPageNo = activePage;
        let fetchPageSize = pageSize;
        let fetchCategoryId = null;

        // If it's a number, it's a DB category ID
        if (typeof categoryParam === 'number') {
          fetchCategoryId = categoryParam;
        } 
        // If it's a string, it's a grouped UI category (Events, Cosplay)
        else if (isGroupedCategory) {
          fetchPageNo = 0;
          fetchPageSize = 200; // Fetch all to filter locally
        }

        const data = await fetchCostumes({ 
          categoryId: fetchCategoryId, 
          keyword,
          sortBy,
          sortDir,
          pageNo: fetchPageNo,
          pageSize: fetchPageSize, 
          signal: controller.signal 
        });
        
        if (controller.signal.aborted || !isMounted) return;

        const actualData = Array.isArray(data) ? data : (data?.data || []);
        let mappedCostumes = actualData.map(mapCostumeToProduct);

        let totalPages = data?.totalPages || 1;
        let totalElements = data?.totalElements || mappedCostumes.length;

        // Apply Local Filtering & Pagination for Grouped UI Categories
        if (isGroupedCategory) {
          const resolvedCategoryName = categoryApiNames[categoryParam] || categoryParam;
          mappedCostumes = mappedCostumes.filter(
            (c) => c.rawCategory.toLowerCase() === resolvedCategoryName.toLowerCase()
          );

          totalElements = mappedCostumes.length;
          totalPages = Math.ceil(totalElements / pageSize) || 1;
          
          const startIndex = activePage * pageSize;
          mappedCostumes = mappedCostumes.slice(startIndex, startIndex + pageSize);
        }

        setState({
          costumes: mappedCostumes,
          totalPages,
          totalElements,
          isLoading: false,
          error: null,
          requestKey,
        });
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        if (isMounted) {
          setState((prev) => ({ ...prev, isLoading: false, error: err }));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [categoryParam, sortBy, sortDir, keyword, activePage, pageSize]);

  return { ...state, activePage, setActivePage };
}
