import { useEffect, useMemo, useState } from 'react';
import { fetchCategoryTree } from '../services/catalogService';
import { flattenCategoryTree } from '../utils/catalogCategory';

export function useCatalogCategories() {
  const [categoryTree, setCategoryTree] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError('');

    fetchCategoryTree()
      .then((data) => {
        if (!isMounted) return;
        setCategoryTree(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setCategoryTree([]);
        setError(requestError.message || 'Không thể tải cây danh mục.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);
  const categoriesByPath = useMemo(
    () => new Map(flatCategories.map((category) => [category.path, category])),
    [flatCategories]
  );

  return {
    categoryTree,
    flatCategories,
    categoriesByPath,
    isLoading,
    error,
  };
}
