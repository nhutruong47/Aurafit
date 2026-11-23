export default function YearbookCollectionHeader({ isLoading, error, productCount }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#DED2C2] pb-5 md:flex-row md:items-end">
      <div>
        <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Bộ sưu tập kỷ yếu</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6259]">
          {isLoading ? 'Đang chuẩn bị danh sách cho bạn...' : `Hiện có ${productCount} mẫu để bạn tham khảo.`}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">Hiện chưa thể tải danh sách sản phẩm. Vui lòng thử lại sau.</p>}
      </div>
      <button className="w-fit border border-[#DED2C2] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6259] transition hover:border-black hover:text-black">
        Sắp xếp nổi bật
      </button>
    </div>
  );
}
