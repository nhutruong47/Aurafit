import { useMemo, useState } from 'react';
import { categoryTaxonomy } from '../data/categories';

export function useCatalogFilters(costumes) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState({ category: null, subcategory: null, tag: null });
  const [expandedCategories, setExpandedCategories] = useState(['Cosplay', 'Event', 'Kỷ yếu', 'Phụ kiện']);
  const [expandedSubcategories, setExpandedSubcategories] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const toggleCategory = (catLabel) => {
    setExpandedCategories((prev) =>
      prev.includes(catLabel) ? prev.filter((category) => category !== catLabel) : [...prev, catLabel]
    );
  };

  const toggleSubcategory = (subLabel) => {
    setExpandedSubcategories((prev) =>
      prev.includes(subLabel) ? prev.filter((subcategory) => subcategory !== subLabel) : [...prev, subLabel]
    );
  };

  const applyFilter = (level, value) => {
    if (level === 'category') {
      setSelectedFilter({ category: value, subcategory: null, tag: null });
    } else if (level === 'subcategory') {
      const parentCat = categoryTaxonomy.find((category) =>
        category.subcategories.some((subcategory) => subcategory.label === value)
      )?.label;
      setSelectedFilter({ category: parentCat, subcategory: value, tag: null });
    } else if (level === 'tag') {
      const parentSub = categoryTaxonomy
        .flatMap((category) => category.subcategories)
        .find((subcategory) => subcategory.tags.includes(value))?.label;
      const parentCat = categoryTaxonomy.find((category) =>
        category.subcategories.some((subcategory) => subcategory.label === parentSub)
      )?.label;
      setSelectedFilter({ category: parentCat, subcategory: parentSub, tag: value });
    }
    setIsMobileFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedFilter({ category: null, subcategory: null, tag: null });
  };

  const filteredCostumes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return costumes.filter((costume) => {
      if (selectedFilter.tag && costume.tag !== selectedFilter.tag) return false;
      if (!selectedFilter.tag && selectedFilter.subcategory && costume.subcategory !== selectedFilter.subcategory) {
        return false;
      }
      if (!selectedFilter.subcategory && selectedFilter.category && costume.category !== selectedFilter.category) {
        return false;
      }

      if (normalizedSearch) {
        const searchableText = `${costume.name} ${costume.category} ${costume.subcategory} ${costume.tag}`.toLowerCase();
        if (!searchableText.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [costumes, searchTerm, selectedFilter]);

  return {
    searchTerm,
    selectedFilter,
    expandedCategories,
    expandedSubcategories,
    isMobileFilterOpen,
    filteredCostumes,
    setSearchTerm,
    setIsMobileFilterOpen,
    toggleCategory,
    toggleSubcategory,
    applyFilter,
    clearFilters,
  };
}
