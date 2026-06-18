// Sidebar bo loc theo danh muc, muc dich va doi tuong cho catalog.
import { categoryTaxonomy } from '../../data/categories';

export default function CatalogFilterSidebar({
  selectedFilter,
  expandedCategories,
  expandedSubcategories,
  isMobileFilterOpen,
  onSetMobileFilterOpen,
  onClearFilters,
  onApplyFilter,
  onToggleCategory,
  onToggleSubcategory,
}) {
  return (
    <>
      <button
        onClick={() => onSetMobileFilterOpen(!isMobileFilterOpen)}
        className="flex items-center justify-between border border-[#cfc4c5] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] lg:hidden"
      >
        <span>Lọc danh mục</span>
        <span className="material-symbols-outlined">{isMobileFilterOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      <aside
        className={`${
          isMobileFilterOpen ? 'block' : 'hidden'
        } w-full flex-shrink-0 border border-[#cfc4c5] bg-white p-6 lg:block lg:w-72`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[#cfc4c5]/50 pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Danh mục sản phẩm</h2>
          {(selectedFilter.category || selectedFilter.subcategory || selectedFilter.tag) && (
            <button
              onClick={onClearFilters}
              className="text-[11px] font-semibold uppercase text-[#99854e] hover:text-black"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="space-y-4">
          {categoryTaxonomy.map((category) => (
            <div key={category.id} className="border-b border-[#cfc4c5]/30 pb-4 last:border-0 last:pb-0">
              <div className="group flex cursor-pointer items-center justify-between">
                <button
                  onClick={() => onApplyFilter('category', category.label)}
                  className={`text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                    selectedFilter.category === category.label && !selectedFilter.subcategory
                      ? 'text-[#99854e]'
                      : 'text-black hover:text-[#99854e]'
                  }`}
                >
                  {category.label}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleCategory(category.label);
                  }}
                  className="p-1 text-[#999999] hover:text-black"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {expandedCategories.includes(category.label) ? 'remove' : 'add'}
                  </span>
                </button>
              </div>

              {expandedCategories.includes(category.label) && (
                <div className="mt-3 space-y-3 border-l border-[#cfc4c5]/30 pl-3">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id}>
                      <div className="group flex cursor-pointer items-center justify-between">
                        <button
                          onClick={() => onApplyFilter('subcategory', subcategory.label)}
                          className={`text-sm transition-colors ${
                            selectedFilter.subcategory === subcategory.label && !selectedFilter.tag
                              ? 'font-medium text-[#99854e]'
                              : 'text-[#5f5e5e] hover:text-black'
                          }`}
                        >
                          {subcategory.label}
                        </button>
                        {subcategory.tags && subcategory.tags.length > 0 && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleSubcategory(subcategory.label);
                            }}
                            className="text-[#999999] hover:text-black"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {expandedSubcategories.includes(subcategory.label) ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        )}
                      </div>

                      {expandedSubcategories.includes(subcategory.label) && subcategory.tags && (
                        <div className="mt-2 flex flex-col items-start space-y-2 pl-3">
                          {subcategory.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => onApplyFilter('tag', tag)}
                              className={`text-left text-[13px] transition-colors ${
                                selectedFilter.tag === tag
                                  ? 'font-medium text-[#99854e]'
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
    </>
  );
}
