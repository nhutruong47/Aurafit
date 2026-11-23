import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F6F1E8] px-5 py-24 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756536]">Lỗi 404</p>
      <h1 className="mt-5 font-serif text-4xl italic text-[#211E1B] md:text-5xl">Không tìm thấy trang</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6B6259]">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi. Hãy quay về trang chủ hoặc
        tiếp tục khám phá bộ sưu tập.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="border border-[#3A302A] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3A302A] transition hover:bg-[#3A302A] hover:text-white"
        >
          Về trang chủ
        </Link>
        <Link
          to="/catalog"
          className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6259] transition hover:text-[#211E1B]"
        >
          Xem bộ sưu tập
        </Link>
      </div>
    </div>
  );
}
