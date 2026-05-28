import { useState } from 'react';

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { key: 'home', label: 'Trang chủ' },
    { key: 'catalog', label: 'Bộ sưu tập' },
    { key: 'checkout', label: 'Giỏ hàng' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow duration-300">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              AuraFit
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => onNavigate(link.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentPage === link.key
                    ? 'text-white bg-white/[0.08]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium hover:from-primary-600 hover:to-accent-600 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 active:scale-95">
              Đăng nhập
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.06]">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => {
                    onNavigate(link.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all duration-300 ${
                    currentPage === link.key
                      ? 'text-white bg-white/[0.08]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button className="mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium text-center">
                Đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
