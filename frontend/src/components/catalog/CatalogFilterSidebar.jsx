function CategoryNode({
  category,
  expandedPaths,
  selectedCategoryPath,
  onApplyFilter,
  onToggleCategory,
}) {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0;
  const isExpanded = expandedPaths.includes(category.path);
  const isActive = selectedCategoryPath === category.path;

  return (
    <div className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
      <div className="group flex items-center justify-between gap-3">
        <button
          onClick={() => onApplyFilter('category', category.path)}
          className={`text-left transition-colors ${
            isActive
              ? 'text-[12px] font-semibold uppercase tracking-[0.1em] text-[#99854e]'
              : category.parentPath
                ? 'text-[13px] text-[#5f5e5e] hover:text-black'
                : 'text-[12px] font-semibold uppercase tracking-[0.1em] text-black hover:text-[#99854e]'
          }`}
        >
          {category.name}
        </button>

        {hasChildren && (
          <button
            onClick={() => onToggleCategory(category.path)}
            className="p-1 text-[#999999] hover:text-black"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'remove' : 'add'}
            </span>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-3 space-y-3 border-l border-[#cfc4c5]/30 pl-3">
          {category.children.map((child) => (
            <CategoryNode
              key={child.path}
              category={{ ...child, parentPath: category.path }}
              expandedPaths={expandedPaths}
              selectedCategoryPath={selectedCategoryPath}
              onApplyFilter={onApplyFilter}
              onToggleCategory={onToggleCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogFilterSidebar({
  categoryTree,
  availableTags,
  selectedFilter,
  expandedPaths,
  isMobileFilterOpen,
  onSetMobileFilterOpen,
  onClearFilters,
  onApplyFilter,
  onToggleCategory,
}) {
  const hasActiveFilter = Boolean(selectedFilter.categoryPath || selectedFilter.tag);

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
          {hasActiveFilter && (
            <button
              onClick={onClearFilters}
              className="text-[11px] font-semibold uppercase text-[#99854e] hover:text-black"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="space-y-4">
          {categoryTree.map((category) => (
            <CategoryNode
              key={category.path}
              category={category}
              expandedPaths={expandedPaths}
              selectedCategoryPath={selectedFilter.categoryPath}
              onApplyFilter={onApplyFilter}
              onToggleCategory={onToggleCategory}
            />
          ))}
        </div>

        {availableTags.length > 0 && (
          <div className="mt-8 border-t border-[#cfc4c5]/50 pt-6">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
              Tags metadata
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 18).map((tag) => {
                const isActive = selectedFilter.tag === tag;

                return (
                  <button
                    key={tag}
                    onClick={() => onApplyFilter('tag', tag)}
                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                      isActive
                        ? 'border-[#99854e] bg-[#99854e] text-white'
                        : 'border-[#d7d2c8] text-[#5f5e5e] hover:border-black hover:text-black'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
