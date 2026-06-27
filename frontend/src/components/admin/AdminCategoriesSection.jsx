import { AdminField, Panel } from './AdminDashboardShared';

export default function AdminCategoriesSection({
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
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
      {/* ── Form tạo / sửa ── */}
      <Panel title={editingCategoryId ? 'Sửa danh mục' : 'Thêm danh mục'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <AdminField
            label="Tên danh mục"
            name="name"
            value={categoryForm.name}
            onChange={onFieldChange}
          />
          <AdminField
            label="Mô tả"
            name="description"
            value={categoryForm.description}
            onChange={onFieldChange}
            multiline
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

          <button
            disabled={isSaving}
            className="w-full bg-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
          >
            {isSaving
              ? 'Đang lưu...'
              : editingCategoryId
                ? 'Cập nhật danh mục'
                : 'Thêm danh mục'}
          </button>

          {editingCategoryId && (
            <button
              type="button"
              onClick={onReset}
              className="w-full border border-[#d7d2c8] py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
            >
              Hủy sửa
            </button>
          )}
        </form>
      </Panel>

      {/* ── Bảng danh sách ── */}
      <Panel title="Danh sách danh mục" action={`${categories.length} danh mục`}>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-[#5f5e5e]">Đang tải...</p>
        ) : categories.length === 0 ? (
          <p className="border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">
            Chưa có danh mục nào. Hãy thêm danh mục đầu tiên.
          </p>
        ) : (
          <div className="divide-y divide-[#ebe7df]">
            {categories.map((category) => (
              <article
                key={category.id}
                className={`flex items-start justify-between gap-4 py-4 transition ${
                  editingCategoryId === category.id ? 'bg-[#fbf8f0]' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f7041]">
                    #{category.id}
                  </p>
                  <h3 className="mt-1 font-serif text-xl italic leading-snug">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5f5e5e]">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => onEdit(category)}
                    className="border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete(category.id, category.name)}
                    className="border border-red-300 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-600 hover:text-white"
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}
