import { useState } from 'react';
import AdminDrawer from './AdminDrawer';
import { AdminField, Panel } from './AdminDashboardShared';
import Pagination from './Pagination';
import SearchableSelect from '../ui/SearchableSelect';

export default function AdminCategoriesSection({
  publicCategories,
  categories,
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
  page,
  totalPages,
  totalElements,
  setPage,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr]">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
              search
            </span>
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="w-full max-w-md border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
            />
          </label>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-[#5f5e5e]">Đang tải danh mục...</p>
        ) : categories.length === 0 ? (
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
                  {categories.map((category) => {
                    const parentCat = category.parentId
                      ? publicCategories.find((c) => c.id === category.parentId)
                      : null;

                    return (
                      <tr
                        key={category.id}
                        className="transition hover:bg-[#f5f2eb]"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-[#999999]">
                          #{category.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-black">{category.name}</p>
                          {category.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-[#5f5e5e]">{category.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <code className="bg-[#eeeeee] px-1.5 py-0.5 text-xs">{category.slug || '—'}</code>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#5f5e5e]">
                          {category.path || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#5f5e5e]">
                          {parentCat?.name || (category.parentName) || '—'}
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
            <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
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
