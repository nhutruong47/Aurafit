import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { categoryTaxonomy } from '../data/categories';
import { useCostumes } from '../hooks/useCostumes';
import { fallbackProductImage, toCartItem } from '../utils/productMapper';

export default function Catalog({ onNavigate, onAddToCart, searchFocusToken = 0 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState({ category: null, subcategory: null, tag: null });
  const [expandedCategories, setExpandedCategories] = useState(['Cosplay', 'Event', 'Kỷ yếu', 'Phụ kiện']);
  const [expandedSubcategories, setExpandedSubcategories] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const { costumes, isLoading, error } = useCostumes();

  useEffect(() => {
    if (searchFocusToken > 0) {
      window.setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [searchFocusToken]);

  const toggleCategory = (catLabel) => {
    setExpandedCategories((prev) =>
      prev.includes(catLabel) ? prev.filter((c) => c !== catLabel) : [...prev, catLabel]
    );
  };

  const toggleSubcategory = (subLabel) => {
    setExpandedSubcategories((prev) =>
      prev.includes(subLabel) ? prev.filter((s) => s !== subLabel) : [...prev, subLabel]
    );
  };

  const applyFilter = (level, value) => {
    if (level === 'category') {
      setSelectedFilter({ category: value, subcategory: null, tag: null });
    } else if (level === 'subcategory') {
      const parentCat = categoryTaxonomy.find((c) => c.subcategories.some((s) => s.label === value))?.label;
      setSelectedFilter({ category: parentCat, subcategory: value, tag: null });
    } else if (level === 'tag') {
      const parentSub = categoryTaxonomy
        .flatMap((c) => c.subcategories)
        .find((s) => s.tags.includes(value))?.label;
      const parentCat = categoryTaxonomy.find((c) =>
        c.subcategories.some((s) => s.label === parentSub)
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
      // Check Taxonomy Filters
      if (selectedFilter.tag && costume.tag !== selectedFilter.tag) return false;
      if (!selectedFilter.tag && selectedFilter.subcategory && costume.subcategory !== selectedFilter.subcategory)
        return false;
      if (!selectedFilter.subcategory && selectedFilter.category && costume.category !== selectedFilter.category)
        return false;

      // Check Search Term
      if (normalizedSearch) {
        const searchableText = `${costume.name} ${costume.category} ${costume.subcategory} ${costume.tag}`.toLowerCase();
        if (!searchableText.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [costumes, selectedFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">The Collection</p>
          <h1 className="mb-4 font-serif text-4xl font-normal italic text-black sm:text-5xl">Bộ sưu tập trang phục</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#5f5e5e]">
            Khám phá hàng ngàn sản phẩm đa dạng từ Cosplay, Sự kiện, Kỷ yếu đến Phụ kiện.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden flex items-center justify-between border border-[#cfc4c5] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em]"
          >
            <span>Lọc danh mục</span>
            <span className="material-symbols-outlined">{isMobileFilterOpen ? 'expand_less' : 'expand_more'}</span>
          </button>

          {/* Sidebar Filters */}
          <aside
            className={`${
              isMobileFilterOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-72 flex-shrink-0 bg-white border border-[#cfc4c5] p-6`}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#cfc4c5]/50">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Danh mục sản phẩm</h2>
              {(selectedFilter.category || selectedFilter.subcategory || selectedFilter.tag) && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] font-semibold text-[#99854e] hover:text-black uppercase"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="space-y-4">
              {categoryTaxonomy.map((category) => (
                <div key={category.id} className="border-b border-[#cfc4c5]/30 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between group cursor-pointer">
                    <button
                      onClick={() => applyFilter('category', category.label)}
                      className={`text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                        selectedFilter.category === category.label && !selectedFilter.subcategory
                          ? 'text-[#99854e]'
                          : 'text-black hover:text-[#99854e]'
                      }`}
                    >
                      {category.label}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.label);
                      }}
                      className="p-1 text-[#999999] hover:text-black"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {expandedCategories.includes(category.label) ? 'remove' : 'add'}
                      </span>
                    </button>
                  </div>

                  {expandedCategories.includes(category.label) && (
                    <div className="mt-3 pl-3 space-y-3 border-l border-[#cfc4c5]/30">
                      {category.subcategories.map((sub) => (
                        <div key={sub.id}>
                          <div className="flex items-center justify-between cursor-pointer group">
                            <button
                              onClick={() => applyFilter('subcategory', sub.label)}
                              className={`text-sm transition-colors ${
                                selectedFilter.subcategory === sub.label && !selectedFilter.tag
                                  ? 'text-[#99854e] font-medium'
                                  : 'text-[#5f5e5e] hover:text-black'
                              }`}
                            >
                              {sub.label}
                            </button>
                            {sub.tags && sub.tags.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSubcategory(sub.label);
                                }}
                                className="text-[#999999] hover:text-black"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {expandedSubcategories.includes(sub.label) ? 'expand_less' : 'expand_more'}
                                </span>
                              </button>
                            )}
                          </div>

                          {expandedSubcategories.includes(sub.label) && sub.tags && (
                            <div className="mt-2 pl-3 space-y-2 flex flex-col items-start">
                              {sub.tags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => applyFilter('tag', tag)}
                                  className={`text-[13px] text-left transition-colors ${
                                    selectedFilter.tag === tag
                                      ? 'text-[#99854e] font-medium'
                                      : 'text-[#777777] hover:text-black'
                                  }`}
                                >
                                  - {tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-4 border border-[#cfc4c5] bg-white p-4 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-3">
                <span className="material-symbols-outlined text-[#99854e]">search</span>
                <input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-transparent py-3 text-base text-black outline-none placeholder:text-[#999999]"
                  placeholder="Tìm theo tên sản phẩm..."
                  type="search"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="border border-[#cfc4c5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black"
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            {/* Current Filter Breadcrumbs */}
            {(selectedFilter.category || selectedFilter.subcategory || selectedFilter.tag) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[#777777]">Đang xem:</span>
                {selectedFilter.category && (
                  <span className="bg-[#f0f0f0] px-3 py-1 rounded-full text-black">{selectedFilter.category}</span>
                )}
                {selectedFilter.subcategory && (
                  <>
                    <span className="text-[#cfc4c5]">/</span>
                    <span className="bg-[#f0f0f0] px-3 py-1 rounded-full text-black">{selectedFilter.subcategory}</span>
                  </>
                )}
                {selectedFilter.tag && (
                  <>
                    <span className="text-[#cfc4c5]">/</span>
                    <span className="bg-[#99854e] text-white px-3 py-1 rounded-full">{selectedFilter.tag}</span>
                  </>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-[#5f5e5e]">
                {isLoading ? (
                  'Đang tải sản phẩm từ database...'
                ) : (
                  <>
                    Tìm thấy <span className="text-black font-medium">{filteredCostumes.length}</span> trang phục
                  </>
                )}
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  Chưa kết nối được backend/database. Vui lòng chạy BE ở port 8080 rồi tải lại trang.
                </p>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCostumes.map((costume) => (
                <article
                  key={costume.id}
                  onClick={() => onNavigate?.('productDetail', costume)}
                  className="group relative overflow-hidden border border-[#cfc4c5] bg-white transition-all duration-500 hover:border-[#99854e]/50 cursor-pointer"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={costume.image}
                      alt={costume.name}
                      onError={(event) => {
                        event.currentTarget.src = fallbackProductImage;
                      }}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20" />

                    <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                      <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
                        {costume.category}
                      </span>
                      {costume.tag && (
                        <span className="px-2 py-0.5 rounded-sm bg-white/20 backdrop-blur-md text-[10px] uppercase tracking-wider text-white border border-white/20">
                          {costume.tag}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md border ${
                          costume.available
                            ? 'bg-green-500/20 text-green-100 border-green-500/30'
                            : 'bg-red-500/20 text-red-100 border-red-500/30'
                        }`}
                      >
                        {costume.available ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                      <button className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold uppercase tracking-widest border border-white/30 hover:bg-white/30 transition-colors duration-200">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-black mb-1 group-hover:text-[#99854e] transition-colors duration-300 line-clamp-1">
                      {costume.name}
                    </h3>
                    <p className="text-[11px] text-[#777777] mb-4 line-clamp-1">{costume.subcategory} • {costume.tag}</p>

                    <div className="mb-5 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#999999] block mb-1">Giá thuê</span>
                        <span className="font-serif text-xl text-black">
                          {formatCurrency(costume.priceValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#999999] block mb-1">Tiền cọc</span>
                        <span className="font-serif text-xl text-black">{formatCurrency(costume.depositValue)}</span>
                      </div>
                    </div>

                    <button
                      disabled={!costume.available}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(toCartItem(costume));
                      }}
                      className={`w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
                        costume.available
                          ? 'bg-black text-white hover:bg-[#99854e]'
                          : 'bg-[#eeeeee] text-[#999999] cursor-not-allowed'
                      }`}
                    >
                      Thuê ngay
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredCostumes.length === 0 && (
              <div className="text-center py-20 bg-white border border-[#cfc4c5]">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#f9f9f9] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px] text-[#999999]">search_off</span>
                </div>
                <h3 className="text-lg font-serif italic text-black mb-2">Không tìm thấy trang phục</h3>
                <p className="text-sm text-[#5f5e5e]">Thử chọn danh mục khác hoặc xóa bộ lọc để xem thêm.</p>
                <button
                  onClick={clearFilters}
                  className="mt-6 border-b border-[#99854e] pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e] hover:text-black hover:border-black transition"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
