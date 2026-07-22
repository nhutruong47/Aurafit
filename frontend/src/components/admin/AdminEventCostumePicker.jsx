import { useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const normalizeSearchValue = (value) => String(value || '').trim().toLocaleLowerCase('vi-VN');
const UNCATEGORIZED_FILTER = 'uncategorized';

export default function AdminEventCostumePicker({
  costumes = [],
  assignments = [],
  onChange,
  disabled = false,
  isLoading = false,
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const assignmentsByCostumeId = useMemo(
    () => new Map(assignments.map((assignment) => [Number(assignment.costumeId), assignment])),
    [assignments]
  );
  const categoryOptions = useMemo(() => {
    const categoriesById = new Map();
    let hasUncategorizedCostume = false;

    costumes.forEach((costume) => {
      if (costume.category?.id != null) {
        categoriesById.set(String(costume.category.id), costume.category.name);
      } else {
        hasUncategorizedCostume = true;
      }
    });

    const options = [...categoriesById.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'));

    if (hasUncategorizedCostume) {
      options.push({ id: UNCATEGORIZED_FILTER, name: 'Chưa có danh mục' });
    }
    return options;
  }, [costumes]);
  const normalizedSearch = normalizeSearchValue(search);
  const filteredCostumes = useMemo(() => {
    return costumes
      .filter((costume) => {
        const matchesCategory = categoryFilter === 'all'
          || (categoryFilter === UNCATEGORIZED_FILTER && costume.category?.id == null)
          || String(costume.category?.id) === categoryFilter;
        if (!matchesCategory) return false;

        if (!normalizedSearch) return true;
        return normalizeSearchValue([
          costume.name,
          costume.slug,
          costume.category?.name,
        ].join(' ')).includes(normalizedSearch);
      })
      .sort((left, right) => (
        Number(assignmentsByCostumeId.has(Number(right.id)))
        - Number(assignmentsByCostumeId.has(Number(left.id)))
      ));
  }, [assignmentsByCostumeId, categoryFilter, costumes, normalizedSearch]);

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

  return (
    <div className="space-y-4 border border-[#d7d2c8] bg-[#fafaf8] p-4">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
            Sản phẩm áp dụng
          </p>
          <p className="mt-1 text-xs text-[#5f5e5e]">
            Đã chọn {assignments.length} sản phẩm. Mức giảm riêng để trống sẽ dùng mức giảm chung của event.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
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
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
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
