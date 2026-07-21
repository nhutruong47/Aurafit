import { Link } from 'react-router-dom';

export default function Footer({ onNavigate }) {
  return (
    <footer className="w-full overflow-x-hidden bg-[#F9F9F9] pt-20 pb-12 border-t border-gray-200 relative">
      <div className="max-w-screen-2xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-gray-600">
        {/* Column 1: Brand Info */}
        <div className="flex flex-col items-start space-y-6">
          <h2 className="font-serif text-3xl font-normal tracking-[0.2em] text-black uppercase">AuraFit</h2>
          <p className="leading-relaxed text-base max-w-xs">
            Tái định nghĩa trải nghiệm thuê đồ cao cấp bằng tuyển chọn tinh tế và vòng đời bền vững. Tỏa sáng trong mọi khoảnh khắc.
          </p>
        </div>
        {/* Column 2: Company Links */}
        <div className="flex flex-col items-start space-y-4">
          <h3 className="font-bold text-black uppercase tracking-wider mb-2">Công Ty</h3>
          <Link className="hover:text-black transition-colors uppercase text-xs font-semibold tracking-wider" to="/care">Giới Thiệu</Link>
          <Link className="hover:text-black transition-colors uppercase text-xs font-semibold tracking-wider" to="/policy">Điều Khoản</Link>
          <Link className="hover:text-black transition-colors uppercase text-xs font-semibold tracking-wider" to="/policy">Chính Sách Thuê</Link>
        </div>
        {/* Column 3: Customer Support */}
        <div className="flex flex-col items-start space-y-4">
          <h3 className="font-bold text-black uppercase tracking-wider mb-2">Hỗ Trợ Khách Hàng</h3>
          <Link className="hover:text-black transition-colors uppercase text-xs font-semibold tracking-wider" to="/care">Liên Hệ</Link>
          <Link className="hover:text-black transition-colors uppercase text-xs font-semibold tracking-wider" to="/policy">FAQ</Link>
          <Link className="hover:text-black transition-colors uppercase text-xs font-semibold tracking-wider" to="/policy">Giao Nhận</Link>
        </div>
        {/* Column 4: Connection & Contact */}
        <div className="flex flex-col items-start space-y-6">
          <h3 className="font-bold text-black uppercase tracking-wider mb-2">Kết Nối</h3>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            <p className="leading-relaxed">Địa chỉ: Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh.</p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <a aria-label="Share" className="text-gray-500 hover:text-black transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </a>
            <a aria-label="Email" className="text-gray-500 hover:text-black transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
