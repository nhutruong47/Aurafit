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
    <div className="border-b border-[#e8dfd5] pb-3 last:border-0 last:pb-0">
      <div className="group flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onApplyFilter('category', category.path)}
          className={`text-left transition-colors ${
            isActive
              ? 'text-[12px] font-semibold uppercase tracking-[0.1em] text-[#3f7c78]'
              : category.parentPath
                ? 'text-[13px] text-[#6f6259] hover:text-[#2f251f]'
                : 'text-[12px] font-semibold uppercase tracking-[0.1em] text-[#2f251f] hover:text-[#3f7c78]'
          }`}
        >
          {category.name}
        </button>

        {hasChildren && (
          <button
            type="button"
            onClick={() => onToggleCategory(category.path)}
            aria-label={`${isExpanded ? 'Thu gọn' : 'Mở rộng'} ${category.name}`}
            aria-expanded={isExpanded}
            className="p-1 text-[#9b9087] hover:text-[#2f251f]"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'remove' : 'add'}
            </span>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-3 space-y-3 border-l border-[#ded2c6] pl-3">
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
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={() => onSetMobileFilterOpen(!isMobileFilterOpen)}
        aria-expanded={isMobileFilterOpen}
        aria-controls="catalog-filter-panel"
        className="flex h-full min-h-[58px] w-full items-center justify-between gap-3 rounded-lg border border-[#ded2c6] bg-[#fffdfa] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#2f251f] transition hover:border-[#4d3830] sm:px-5 sm:text-sm sm:tracking-[0.1em]"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#3f7c78]">category</span>
          Danh mục sản phẩm
        </span>
        <span className="material-symbols-outlined">{isMobileFilterOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      <aside
        id="catalog-filter-panel"
        className={`${
          isMobileFilterOpen ? 'block' : 'hidden'
        } custom-scrollbar absolute left-0 top-full z-40 mt-2 max-h-[32rem] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-[#ded2c6] bg-[#fffdfa] p-6 shadow-xl`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[#ded2c6] pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#2f251f]">Danh mục sản phẩm</h2>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                onClearFilters();
                onSetMobileFilterOpen(false);
              }}
              className="text-[11px] font-semibold uppercase text-[#3f7c78] hover:text-[#2f251f]"
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
          <div className="mt-8 border-t border-[#ded2c6] pt-6">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f6259]">
              Phong cách
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 18).map((tag) => {
                const isActive = selectedFilter.tag === tag;

                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => onApplyFilter('tag', tag)}
                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                      isActive
                        ? 'border-[#3f7c78] bg-[#3f7c78] text-white'
                        : 'border-[#ded2c6] text-[#6f6259] hover:border-[#4d3830] hover:text-[#2f251f]'
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
    </div>
  );
}
