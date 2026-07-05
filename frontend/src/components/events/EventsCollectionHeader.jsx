// Tieu de va trang thai danh sach san pham cua trang Events.
export default function EventsCollectionHeader({ isLoading, error, productCount }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#cfc4c5] pb-5 md:flex-row md:items-end">
      <div>
        <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Bộ sưu tập sự kiện</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
          {isLoading ? 'Đang chuẩn bị danh sách cho bạn...' : `Đang hiển thị ${productCount} sản phẩm sự kiện.`}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">Hiện chưa thể tải danh sách sản phẩm. Vui lòng thử lại sau.</p>}
      </div>
      <button className="w-fit border border-[#cfc4c5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black">
        Sắp xếp theo dịp
      </button>
    </div>
  );
}
