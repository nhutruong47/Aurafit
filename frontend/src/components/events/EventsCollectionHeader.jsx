// Tieu de va trang thai danh sach san pham cua trang Events.
export default function EventsCollectionHeader({ isLoading, error, productCount }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#cfc4c5] pb-5 md:flex-row md:items-end">
      <div>
        <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Events Collection</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
          {isLoading
            ? 'Đang tải sản phẩm Events từ database...'
            : `Đang hiển thị ${productCount} sản phẩm Events từ database.`}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">Chưa kết nối được backend/database.</p>}
      </div>
      <button className="w-fit border border-[#cfc4c5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black">
        Sort by Occasion
      </button>
    </div>
  );
}
