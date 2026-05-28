export default function Footer() {
  return (
    <footer className="bg-[#0a0a14] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AF</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                AuraFit
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md mb-6">
              Nền tảng cho thuê trang phục thông minh với AI gợi ý. Từ áo dài, vest, kimono đến váy dạ hội — 
              AuraFit giúp bạn tìm trang phục hoàn hảo cho mọi dịp.
            </p>
            <div className="flex gap-3">
              {['Facebook', 'Instagram', 'TikTok'].map((social) => (
                <button
                  key={social}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-300"
                >
                  <span className="text-xs font-medium">{social[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Liên kết nhanh</h4>
            <ul className="space-y-3">
              {['Trang chủ', 'Bộ sưu tập', 'Về chúng tôi', 'Chính sách thuê', 'Hỗ trợ'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-gray-500 hover:text-primary-400 transition-colors duration-200">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-500">Lô E2a-7, Đường D1, TP. Thủ Đức, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-gray-500">0901 234 567</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-500">contact@aurafit.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            © 2026 AuraFit. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-6">
            {['Điều khoản', 'Bảo mật', 'Cookie'].map((link) => (
              <a key={link} href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
