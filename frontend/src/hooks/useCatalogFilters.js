import { useEffect, useMemo, useState } from 'react';
import {
  buildAncestorPaths,
  buildSelectedCategoryState,
  flattenCategoryTree,
} from '../utils/catalogCategory';
import {
  getCostumeCategoryPath,
  getCostumeDisplayCategory,
  getCostumeSubcategory,
  getCostumeTag,
  getCostumeTags,
} from '../utils/costumeUtils';

export function useCatalogFilters(costumes, categoryTree, initialCategoryPath = null) {
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);
  const categoriesByPath = useMemo(
    () => new Map(flatCategories.map((category) => [category.path, category])),
    [flatCategories]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(() =>
    buildSelectedCategoryState(initialCategoryPath, categoriesByPath)
  );
  const [expandedPaths, setExpandedPaths] = useState(() =>
    initialCategoryPath ? buildAncestorPaths(initialCategoryPath, categoriesByPath) : []
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedFilter((current) => {
      if (current.categoryPath === initialCategoryPath && current.tag === null) {
        return current;
      }

      return buildSelectedCategoryState(initialCategoryPath, categoriesByPath);
    });

    if (!initialCategoryPath) {
      return;
    }

    const ancestorPaths = buildAncestorPaths(initialCategoryPath, categoriesByPath);
    setExpandedPaths((current) => [...new Set([...current, ...ancestorPaths])]);
  }, [categoriesByPath, initialCategoryPath]);

  const toggleCategory = (categoryPath) => {
    setExpandedPaths((current) =>
      current.includes(categoryPath)
        ? current.filter((path) => path !== categoryPath)
        : [...current, categoryPath]
    );
  };

  const applyFilter = (level, value) => {
    if (level === 'category') {
      setSelectedFilter(buildSelectedCategoryState(value, categoriesByPath));
    }

    if (level === 'tag') {
      setSelectedFilter((current) => ({
        ...current,
        tag: current.tag === value ? null : value,
      }));
    }

    setIsMobileFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedFilter(buildSelectedCategoryState(null, categoriesByPath));
    setSearchTerm('');
  };

  const availableTags = useMemo(() => {
    const tagSet = new Set();

    costumes.forEach((costume) => {
      getCostumeTags(costume).forEach((tag) => {
        if (tag) {
          tagSet.add(tag);
        }
      });
    });

    return [...tagSet].sort((left, right) => left.localeCompare(right, 'vi'));
  }, [costumes]);

  const filteredCostumes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return costumes.filter((costume) => {
      if (selectedFilter.categoryPath) {
        const costumePath = getCostumeCategoryPath(costume) || '';
        const matchesSelectedCategory =
          costumePath === selectedFilter.categoryPath ||
          costumePath.startsWith(`${selectedFilter.categoryPath}/`);

        if (!matchesSelectedCategory) {
          return false;
        }
      }

      if (selectedFilter.tag && !getCostumeTags(costume).includes(selectedFilter.tag)) {
        return false;
      }

      if (normalizedSearch) {
        const searchableText = [
          costume.name,
          costume.description,
          getCostumeDisplayCategory(costume),
          getCostumeSubcategory(costume),
          getCostumeTag(costume),
          ...getCostumeTags(costume),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [costumes, searchTerm, selectedFilter.categoryPath, selectedFilter.tag]);

  return {
    searchTerm,
    selectedFilter,
    expandedPaths,
    isMobileFilterOpen,
    availableTags,
    filteredCostumes,
    setSearchTerm,
    setIsMobileFilterOpen,
    toggleCategory,
    applyFilter,
    clearFilters,
  };
}
