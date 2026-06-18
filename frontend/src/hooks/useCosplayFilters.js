import { useMemo, useState } from 'react';

const initialFilters = {
  subcategory: [],
  tag: [],
  size: [],
};

export function useCosplayFilters(products, filterGroups) {
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);
  const [quickFilter, setQuickFilter] = useState('all');

  const availableFilterGroups = useMemo(
    () =>
      filterGroups
        .map((group) => ({
          ...group,
          items: [...new Set(products.map((product) => product[group.key]).filter(Boolean))],
        }))
        .filter((group) => group.items.length > 0),
    [filterGroups, products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCheckboxes = availableFilterGroups.every((group) => {
        const selected = selectedFilters[group.key];
        return selected.length === 0 || selected.includes(product[group.key]);
      });

      const matchesQuickFilter =
        quickFilter === 'all' ||
        (quickFilter === 'available' && product.available) ||
        (quickFilter === 'free-size' && product.size === 'Free Size');

      return matchesCheckboxes && matchesQuickFilter;
    });
  }, [availableFilterGroups, products, quickFilter, selectedFilters]);

  const activeFilterCount =
    Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0) +
    (quickFilter === 'all' ? 0 : 1);

  const toggleFilter = (groupKey, item) => {
    setSelectedFilters((current) => {
      const currentItems = current[groupKey];
      const nextItems = currentItems.includes(item)
        ? currentItems.filter((value) => value !== item)
        : [...currentItems, item];

      return {
        ...current,
        [groupKey]: nextItems,
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters(initialFilters);
    setQuickFilter('all');
  };

  return {
    selectedFilters,
    quickFilter,
    setQuickFilter,
    availableFilterGroups,
    filteredProducts,
    activeFilterCount,
    toggleFilter,
    clearFilters,
  };
}
