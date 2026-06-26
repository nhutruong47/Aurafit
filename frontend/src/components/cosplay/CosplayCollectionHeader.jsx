// Tieu de bo suu tap Cosplay kem quick filter va trang thai loading.
const quickFilterButtons = [
  { key: 'available', label: 'Còn hàng' },
  { key: 'free-size', label: 'Freesize' },
];

export default function CosplayCollectionHeader({
  isLoading,
  error,
  filteredCount,
  totalCount,
  quickFilter,
  onQuickFilterChange,
}) {
  return (
    <div className="mb-10 grid gap-6 border-b border-[#cfc4c5] pb-6 md:grid-cols-[1.3fr_0.7fr] md:items-end">
      <div>
        <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Nhân vật nổi bật</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
          {isLoading
            ? 'Đang tải sản phẩm Cosplay...'
            : `Đang hiển thị ${filteredCount} / ${totalCount} set.`}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">Chưa kết nối được backend/database.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {quickFilterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => onQuickFilterChange(button.key)}
            className={`border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              quickFilter === button.key
                ? 'border-black bg-black text-white'
                : 'border-[#cfc4c5] text-[#5f5e5e] hover:border-black hover:text-black'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
