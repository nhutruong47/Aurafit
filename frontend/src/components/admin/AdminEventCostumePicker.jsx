import { useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const normalizeSearchValue = (value) => String(value || '').trim().toLocaleLowerCase('vi-VN');
const UNCATEGORIZED_FILTER = 'uncategorized';
const PARENT_CATEGORY_FILTER_PREFIX = 'parent:';
const DEFAULT_FILTERS = {
  category: 'all',
  selection: 'all',
  sort: 'selected-first',
};

const STATUS_LABELS = {
  ACTIVE: 'Đang hiển thị',
  INACTIVE: 'Tạm ẩn',
  DISCONTINUED: 'Ngừng kinh doanh',
};

export default function AdminEventCostumePicker({
  costumes = [],
  assignments = [],
  onChange,
  disabled = false,
  isLoading = false,
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(DEFAULT_FILTERS.category);
  const [selectionFilter, setSelectionFilter] = useState(DEFAULT_FILTERS.selection);
  const [sortBy, setSortBy] = useState(DEFAULT_FILTERS.sort);
  const assignmentsByCostumeId = useMemo(
    () => new Map(assignments.map((assignment) => [Number(assignment.costumeId), assignment])),
    [assignments]
  );
  const categoryOptions = useMemo(() => {
    const categoriesById = new Map();
    const parentCategoriesById = new Map();
    let hasUncategorizedCostume = false;

    costumes.forEach((costume) => {
      if (costume.category?.id != null) {
        const categoryName = costume.category.parentName
          ? `${costume.category.parentName} / ${costume.category.name}`
          : costume.category.name;
        const categoryId = String(costume.category.id);
        const currentCategory = categoriesById.get(categoryId);
        categoriesById.set(categoryId, {
          id: categoryId,
          name: categoryName,
          count: (currentCategory?.count || 0) + 1,
          kind: 'category',
        });

        if (costume.category.parentId != null && costume.category.parentName) {
          const parentId = String(costume.category.parentId);
          const currentParent = parentCategoriesById.get(parentId);
          parentCategoriesById.set(parentId, {
            id: `${PARENT_CATEGORY_FILTER_PREFIX}${parentId}`,
            name: `${costume.category.parentName} (gồm danh mục con)`,
            count: (currentParent?.count || 0) + 1,
            kind: 'parent',
          });
        }
      } else {
        hasUncategorizedCostume = true;
      }
    });

    const options = [
      ...[...parentCategoriesById.values()]
        .sort((left, right) => left.name.localeCompare(right.name, 'vi')),
      ...[...categoriesById.values()]
        .sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    ];

    if (hasUncategorizedCostume) {
      options.push({
        id: UNCATEGORIZED_FILTER,
        name: 'Chưa có danh mục',
        count: costumes.filter((costume) => costume.category?.id == null).length,
        kind: 'category',
      });
    }
    return options;
  }, [costumes]);
  const normalizedSearch = normalizeSearchValue(search);
  const filteredCostumes = useMemo(() => {
    return costumes
      .filter((costume) => {
        const parentCategoryFilter = categoryFilter.startsWith(PARENT_CATEGORY_FILTER_PREFIX)
          ? categoryFilter.slice(PARENT_CATEGORY_FILTER_PREFIX.length)
          : null;
        const matchesCategory = categoryFilter === 'all'
          || (categoryFilter === UNCATEGORIZED_FILTER && costume.category?.id == null)
          || (parentCategoryFilter && String(costume.category?.parentId) === parentCategoryFilter)
          || String(costume.category?.id) === categoryFilter;
        if (!matchesCategory) return false;

        const isSelected = assignmentsByCostumeId.has(Number(costume.id));
        if (selectionFilter === 'selected' && !isSelected) return false;
        if (selectionFilter === 'unselected' && isSelected) return false;

        if (!normalizedSearch) return true;
        return normalizeSearchValue([
          costume.name,
          costume.slug,
          costume.category?.name,
          costume.category?.parentName,
        ].join(' ')).includes(normalizedSearch);
      })
      .sort((left, right) => {
        if (sortBy === 'name-asc') return left.name.localeCompare(right.name, 'vi');
        if (sortBy === 'price-asc') return Number(left.rentalPrice || 0) - Number(right.rentalPrice || 0);
        if (sortBy === 'price-desc') return Number(right.rentalPrice || 0) - Number(left.rentalPrice || 0);
        if (sortBy === 'stock-desc') {
          return Number(right.availableItemCount || 0) - Number(left.availableItemCount || 0);
        }
        return (
          Number(assignmentsByCostumeId.has(Number(right.id)))
          - Number(assignmentsByCostumeId.has(Number(left.id)))
          || left.name.localeCompare(right.name, 'vi')
        );
      });
  }, [
    assignmentsByCostumeId,
    categoryFilter,
    costumes,
    normalizedSearch,
    selectionFilter,
    sortBy,
  ]);

  const filteredCostumeIds = useMemo(
    () => new Set(filteredCostumes.map((costume) => Number(costume.id))),
    [filteredCostumes]
  );
  const filteredSelectedCount = filteredCostumes.reduce(
    (count, costume) => count + Number(assignmentsByCostumeId.has(Number(costume.id))),
    0
  );
  const activeFilterCount = [
    Boolean(normalizedSearch),
    categoryFilter !== DEFAULT_FILTERS.category,
    selectionFilter !== DEFAULT_FILTERS.selection,
  ].filter(Boolean).length;

  const toggleCostume = (costumeId) => {
    const normalizedId = Number(costumeId);
    if (assignmentsByCostumeId.has(normalizedId)) {
      onChange?.(assignments.filter((assignment) => Number(assignment.costumeId) !== normalizedId));
      return;
    }
    onChange?.([
      ...assignments,
      { costumeId: normalizedId, discountPercentOverride: '' },
    ]);
  };

  const updateOverride = (costumeId, value) => {
    const normalizedId = Number(costumeId);
    onChange?.(assignments.map((assignment) => (
      Number(assignment.costumeId) === normalizedId
        ? { ...assignment, discountPercentOverride: value }
        : assignment
    )));
  };

  const selectFilteredCostumes = () => {
    const newAssignments = filteredCostumes
      .filter((costume) => !assignmentsByCostumeId.has(Number(costume.id)))
      .map((costume) => ({
        costumeId: Number(costume.id),
        discountPercentOverride: '',
      }));
    if (newAssignments.length > 0) onChange?.([...assignments, ...newAssignments]);
  };

  const unselectFilteredCostumes = () => {
    onChange?.(
      assignments.filter((assignment) => !filteredCostumeIds.has(Number(assignment.costumeId)))
    );
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter(DEFAULT_FILTERS.category);
    setSelectionFilter(DEFAULT_FILTERS.selection);
    setSortBy(DEFAULT_FILTERS.sort);
  };

  return (
    <div className="space-y-4 border border-[#d7d2c8] bg-[#fafaf8] p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
              Sản phẩm áp dụng
            </p>
            <p className="mt-1 text-xs text-[#5f5e5e]">
              Chọn theo danh mục hoặc từng sản phẩm. Mức giảm riêng để trống sẽ dùng mức giảm chung của sự kiện.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <span className="border border-[#d7d2c8] bg-white px-3 py-1.5 text-xs text-[#5f5e5e]">
              Kết quả <strong className="text-black">{filteredCostumes.length}</strong>
            </span>
            <span className="border border-[#9b8248] bg-[#fbf7e8] px-3 py-1.5 text-xs text-[#6f5e35]">
              Đã chọn <strong>{assignments.length}</strong>
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_280px]">
          <label className="relative block w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full border border-[#d7d2c8] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7f7041]"
            aria-label="Lọc sản phẩm theo danh mục"
          >
            <option value="all">Tất cả danh mục</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.kind === 'parent' ? 'Nhóm: ' : ''}{category.name} ({category.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[#e3ded4] pt-3 lg:flex-row lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[470px]">
            <select
              value={selectionFilter}
              onChange={(event) => setSelectionFilter(event.target.value)}
              className="w-full border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7f7041]"
              aria-label="Lọc theo trạng thái lựa chọn"
            >
              <option value="all">Tất cả lựa chọn</option>
              <option value="selected">Chỉ sản phẩm đã chọn</option>
              <option value="unselected">Chỉ sản phẩm chưa chọn</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7f7041]"
              aria-label="Sắp xếp sản phẩm"
            >
              <option value="selected-first">Đã chọn lên trước</option>
              <option value="name-asc">Tên A–Z</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="stock-desc">Tồn kho nhiều nhất</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                disabled={disabled}
                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777777] underline decoration-[#c6beb0] underline-offset-4 transition hover:text-black disabled:opacity-50"
              >
                Xóa bộ lọc ({activeFilterCount})
              </button>
            )}
            <button
              type="button"
              onClick={unselectFilteredCostumes}
              disabled={disabled || filteredSelectedCount === 0}
              className="border border-[#d7d2c8] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e] transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Bỏ chọn kết quả ({filteredSelectedCount})
            </button>
            <button
              type="button"
              onClick={selectFilteredCostumes}
              disabled={disabled || filteredCostumes.length === 0 || filteredSelectedCount === filteredCostumes.length}
              className="bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#7f7041] disabled:cursor-not-allowed disabled:bg-[#aaa49a]"
            >
              Chọn tất cả kết quả ({filteredCostumes.length})
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-[#777777]">Đang tải sản phẩm...</p>
      ) : filteredCostumes.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#777777]">Không tìm thấy sản phẩm phù hợp.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {filteredCostumes.map((costume) => {
            const assignment = assignmentsByCostumeId.get(Number(costume.id));
            const isSelected = Boolean(assignment);
            return (
              <div
                key={costume.id}
                className={`grid gap-3 border p-3 sm:grid-cols-[minmax(0,1fr)_170px] ${
                  isSelected ? 'border-[#9b8248] bg-[#fbf7e8]' : 'border-[#e3ded4] bg-white'
                }`}
              >
                <label className="flex min-w-0 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCostume(costume.id)}
                    disabled={disabled}
                    className="h-4 w-4 accent-[#7f7041]"
                  />
                  <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#ebe7df]">
                    {costume.imageUrl ? (
                      <img src={costume.imageUrl} alt={costume.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined flex h-full items-center justify-center text-[#aaa49a]">
                        image
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black">{costume.name}</p>
                    <p className="mt-1 text-xs text-[#777777]">
                      {costume.category?.name || 'Chưa có danh mục'} · {formatCurrency(costume.rentalPrice || 0)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                        costume.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-[#f0ede6] text-[#777777]'
                      }`}>
                        {STATUS_LABELS[costume.status] || costume.status}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold ${
                        Number(costume.availableItemCount || 0) > 0
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        Kho: {Number(costume.availableItemCount || 0)}
                      </span>
                    </div>
                  </div>
                </label>

                {isSelected && (
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777777]">
                      Giảm riêng (%)
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={assignment.discountPercentOverride}
                      onChange={(event) => updateOverride(costume.id, event.target.value)}
                      disabled={disabled}
                      placeholder="Dùng mức chung"
                      className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7f7041]"
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
