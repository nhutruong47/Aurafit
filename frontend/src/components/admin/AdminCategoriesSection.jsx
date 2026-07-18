import { useMemo, useState } from 'react';
import AdminDrawer from './AdminDrawer';
import { AdminField, Panel } from './AdminDashboardShared';
import SearchableSelect from '../ui/SearchableSelect';

const buildTreeRows = (categories) => {
  const ancestors = [];

  return categories.map((category) => {
    const depth = Number(category.depth || 0);
    const parent = depth > 0 ? ancestors[depth - 1] : null;
    const treeRow = {
      ...category,
      depth,
      parentId: parent?.id ?? null,
      parentName: parent?.name ?? null,
      ancestorIds: ancestors.slice(0, depth).map((ancestor) => ancestor.id),
    };

    ancestors[depth] = treeRow;
    ancestors.length = depth + 1;
    return treeRow;
  });
};

const normalizeSearchValue = (value) => String(value || '').toLocaleLowerCase('vi-VN');

const LEVEL_STYLES = [
  {
    row: 'bg-white',
    badge: 'bg-black text-white',
    connector: 'border-black/35',
  },
  {
    row: 'bg-[#fbf9f4]',
    badge: 'bg-[#99854e] text-white',
    connector: 'border-[#99854e]/45',
  },
  {
    row: 'bg-[#f5f1e8]',
    badge: 'bg-[#ded3b9] text-[#4f452d]',
    connector: 'border-[#b9aa86]/55',
  },
  {
    row: 'bg-[#eee9df]',
    badge: 'bg-[#d8d1c3] text-[#4f4b43]',
    connector: 'border-[#aaa08c]/55',
  },
];

const getLevelStyles = (depth) => LEVEL_STYLES[Math.min(depth, LEVEL_STYLES.length - 1)];

export default function AdminCategoriesSection({
  publicCategories,
  categoryForm,
  editingCategoryId,
  isLoading,
  isSaving,
  message,
  error,
  onFieldChange,
  onEdit,
  onReset,
  onSubmit,
  onDelete,
  categorySearch,
  setCategorySearch,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(() => new Set());

  const treeCategories = useMemo(
    () => buildTreeRows(publicCategories),
    [publicCategories]
  );
  const expandableCategoryIds = useMemo(
    () => treeCategories
      .filter((category) => Array.isArray(category.children) && category.children.length > 0)
      .map((category) => category.id),
    [treeCategories]
  );
  const normalizedSearch = categorySearch.trim().toLocaleLowerCase('vi-VN');

  const filteredTreeCategories = useMemo(() => {
    if (!normalizedSearch) return treeCategories;

    const visibleCategoryIds = new Set();
    treeCategories.forEach((category) => {
      const searchableText = [
        category.name,
        category.slug,
        category.path,
        category.description,
      ].map(normalizeSearchValue).join(' ');

      if (searchableText.includes(normalizedSearch)) {
        visibleCategoryIds.add(category.id);
        category.ancestorIds.forEach((ancestorId) => visibleCategoryIds.add(ancestorId));
      }
    });

    return treeCategories.filter((category) => visibleCategoryIds.has(category.id));
  }, [normalizedSearch, treeCategories]);

  const visibleTreeCategories = useMemo(() => {
    if (normalizedSearch) return filteredTreeCategories;

    return filteredTreeCategories.filter((category) => (
      category.ancestorIds.every((ancestorId) => expandedCategoryIds.has(ancestorId))
    ));
  }, [expandedCategoryIds, filteredTreeCategories, normalizedSearch]);

  // Build parent options with hierarchy indentation and block circular dependencies
  const parentOptions = [];
  let skipDepth = -1;

  for (const cat of publicCategories) {
    if (skipDepth !== -1) {
      if (cat.depth > skipDepth) {
        continue; // Skip all descendants
      } else {
        skipDepth = -1; // Stop skipping once we exit the subtree
      }
    }

    if (cat.id === editingCategoryId) {
      skipDepth = cat.depth;
      continue; // Skip the category being edited
    }

    parentOptions.push(cat);
  }

  const handleOpenCreate = () => {
    onReset();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (category) => {
    onEdit(category);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    onReset();
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategoryIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(categoryId)) {
        nextIds.delete(categoryId);
      } else {
        nextIds.add(categoryId);
      }
      return nextIds;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategoryIds(new Set(expandableCategoryIds));
  };

  const collapseAllCategories = () => {
    setExpandedCategoryIds(new Set());
  };

  const handleSubmit = async (event) => {
    await onSubmit(event);
    // Close drawer on success (no error after submit)
    setTimeout(() => setIsDrawerOpen(false), 200);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?\nHành động này không thể hoàn tác.`)) return;
    onDelete(id, name);
  };

  return (
    <>
      {/* Full-width data table */}
      <Panel
        title="Quản lý danh mục"
        action={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm danh mục
          </button>
        }
      >
        {/* Filter bar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md lg:flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
              search
            </span>
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="w-full border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={expandAllCategories}
              disabled={Boolean(normalizedSearch) || expandableCategoryIds.length === 0}
              className="inline-flex items-center gap-1.5 border border-[#bdb39d] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4f493d] transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[17px]">unfold_more</span>
              Mở tất cả
            </button>
            <button
              type="button"
              onClick={collapseAllCategories}
              disabled={Boolean(normalizedSearch) || expandedCategoryIds.size === 0}
              className="inline-flex items-center gap-1.5 border border-[#d7d2c8] bg-[#f6f3ed] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e] transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[17px]">unfold_less</span>
              Thu gọn
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border border-[#e7e1d6] bg-[#faf8f3] px-3 py-2.5 text-xs text-[#5f5e5e]">
          <span className="font-semibold text-black">Chú thích tầng:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 bg-black" /> Cấp 1 · Gốc
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 bg-[#99854e]" /> Cấp 2 · Nhánh
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 bg-[#ded3b9]" /> Cấp 3 trở lên · Danh mục con
          </span>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-[#5f5e5e]">Đang tải danh mục...</p>
        ) : visibleTreeCategories.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#d7d2c8]">category</span>
            <p className="text-sm text-[#5f5e5e]">Không có danh mục nào khớp bộ lọc hiện tại.</p>
            {categorySearch === '' && (
              <button
                onClick={handleOpenCreate}
                className="bg-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
              >
                Thêm danh mục
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  <tr>
                    <th className="px-4 py-3 w-[60px]">ID</th>
                    <th className="px-4 py-3">Tên danh mục</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Path</th>
                    <th className="px-4 py-3">Danh mục cha</th>
                    <th className="px-4 py-3 w-[80px] text-center">Thứ tự</th>
                    <th className="px-4 py-3 w-[140px] text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                  {visibleTreeCategories.map((category) => {
                    const hasChildren = Array.isArray(category.children) && category.children.length > 0;
                    const isExpanded = expandedCategoryIds.has(category.id);
                    const levelStyles = getLevelStyles(category.depth);

                    return (
                      <tr
                        key={category.id}
                        className={`${levelStyles.row} transition hover:bg-[#e9e2d5]`}
                      >
                        <td className={`border-l-4 px-4 py-3.5 font-mono text-xs text-[#777777] ${levelStyles.connector}`}>
                          #{category.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <div
                            className="relative flex items-start gap-2"
                            style={{ paddingLeft: `${category.depth * 24}px` }}
                          >
                            {category.depth > 0 && (
                              <>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute -bottom-3.5 -top-3.5 border-l ${levelStyles.connector}`}
                                  style={{ left: `${category.depth * 24 - 10}px` }}
                                />
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute top-3 w-3 border-t ${levelStyles.connector}`}
                                  style={{ left: `${category.depth * 24 - 10}px` }}
                                />
                              </>
                            )}
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => toggleCategory(category.id)}
                                aria-label={isExpanded
                                  ? `Thu gọn danh mục ${category.name}`
                                  : `Mở rộng danh mục ${category.name}`}
                                aria-expanded={isExpanded || Boolean(normalizedSearch)}
                                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center text-[#777777] transition hover:bg-[#e7e1d6] hover:text-black"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isExpanded || normalizedSearch ? 'expand_more' : 'chevron_right'}
                                </span>
                              </button>
                            ) : (
                              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center text-[#c5bda9]">
                                <span className="material-symbols-outlined text-[15px]">subdirectory_arrow_right</span>
                              </span>
                            )}
                            <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#99854e]">
                              {category.depth === 0 ? 'account_tree' : hasChildren ? 'folder' : 'label'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={category.depth === 0 ? 'font-semibold text-black' : 'font-medium text-black'}>
                                  {category.name}
                                </p>
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${levelStyles.badge}`}>
                                  Cấp {category.depth + 1}
                                </span>
                              </div>
                              {category.description && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-[#5f5e5e]">{category.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <code className="bg-[#eeeeee] px-1.5 py-0.5 text-xs">{category.slug || '—'}</code>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#5f5e5e]">
                          {category.path || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#5f5e5e]">
                          {category.parentName || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs">
                          {category.sortOrder ?? 0}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(category)}
                              className="inline-flex items-center gap-1 border border-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(category.id, category.name)}
                              className="inline-flex items-center gap-1 border border-red-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-600 hover:text-white"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-right text-xs text-[#777777]">
              Hiển thị {visibleTreeCategories.length}/{treeCategories.length} danh mục
            </p>
          </>
        )}
      </Panel>

      {/* Slide-out Drawer for Create/Edit form */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingCategoryId ? 'Sửa danh mục' : 'Thêm danh mục mới'}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <AdminField
            label="Tên danh mục"
            name="name"
            value={categoryForm.name}
            onChange={onFieldChange}
          />
          <AdminField
            label="Slug (tự động tạo từ tên)"
            name="slug"
            value={categoryForm.slug}
            onChange={onFieldChange}
            required={false}
          />

          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
              Danh mục cha
            </span>
            <SearchableSelect
              name="parentId"
              value={categoryForm.parentId}
              onChange={onFieldChange}
              options={[
                { id: '', name: '— Không (Danh mục gốc) —' },
                ...parentOptions
              ]}
              placeholder="Chọn danh mục cha"
            />
          </label>

          <AdminField
            label="Thứ tự sắp xếp"
            name="sortOrder"
            type="number"
            value={categoryForm.sortOrder}
            onChange={onFieldChange}
            required={false}
          />

          <AdminField
            label="Mô tả"
            name="description"
            value={categoryForm.description}
            onChange={onFieldChange}
            multiline
            required={false}
          />

          {message && (
            <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              disabled={isSaving}
              className="flex-1 bg-black py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
            >
              {isSaving
                ? 'Đang lưu...'
                : editingCategoryId
                  ? 'Cập nhật'
                  : 'Thêm mới'}
            </button>
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="border border-[#d7d2c8] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Hủy
            </button>
          </div>
        </form>
      </AdminDrawer>
    </>
  );
}
