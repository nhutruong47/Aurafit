import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({
  currentPage,
  onNavigate,
  onSearchOpen,
  cartCount = 0,
  isAdmin = false,
  isStaff = false,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goPage = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Trang chủ', page: 'home', to: '/' },
    { label: 'Bộ sưu tập', page: 'catalog', to: '/catalog' },
    { label: 'Giới thiệu', page: 'care', to: '/care' },
    { label: 'Chính sách thuê', page: 'policy', to: '/policy' },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Logo Area */}
        <Link className="block" to="/">
          <div className="bg-[#4A3B32] px-6 py-3 flex items-center justify-center">
            <img src="/LogoAF.png" alt="AuraFit" className="h-8 object-contain" />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-x-8 text-sm font-semibold tracking-wide text-gray-600">
            <li>
              <Link className="hover:bg-gray-100 px-4 py-2 rounded-full transition-all duration-300 text-[#A58B5C] uppercase" to="/">Trang Chủ</Link>
            </li>
            <li className="relative group py-2">
              <Link className="hover:bg-gray-100 px-4 py-2 rounded-full transition-all duration-300 uppercase flex items-center gap-1" to="/catalog">
                Bộ Sưu Tập
              </Link>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 py-2">
                <ul className="flex flex-col">
                  <li><Link className="block px-6 py-2 hover:bg-gray-50 hover:text-[#A58B5C] transition-colors text-sm" to="/cosplay">Cosplay</Link></li>
                  <li><Link className="block px-6 py-2 hover:bg-gray-50 hover:text-[#A58B5C] transition-colors text-sm" to="/events">Sự kiện</Link></li>
                  <li><Link className="block px-6 py-2 hover:bg-gray-50 hover:text-[#A58B5C] transition-colors text-sm" to="/traditional">Truyền thống</Link></li>
                  <li><Link className="block px-6 py-2 hover:bg-gray-50 hover:text-[#A58B5C] transition-colors text-sm" to="/yearbook">Yearbook</Link></li>
                </ul>
              </div>
            </li>
            <li>
              <Link className="hover:bg-gray-100 px-4 py-2 rounded-full transition-all duration-300 uppercase" to="/care">Giới Thiệu</Link>
            </li>
            <li>
              <Link className="hover:bg-gray-100 px-4 py-2 rounded-full transition-all duration-300 uppercase" to="/policy">Chính Sách Thuê</Link>
            </li>
          </ul>
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-x-6 text-gray-700">
          <button aria-label="Search" onClick={() => { onSearchOpen?.(); setMobileMenuOpen(false); }} className="hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <button aria-label="Chat" onClick={() => { onNavigate('chat', null, { state: { startNewChatAt: Date.now() } }); setMobileMenuOpen(false); }} className="hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <button aria-label="Order List" onClick={() => goPage('orders')} className="hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <button aria-label="Cart" onClick={() => goPage('checkout')} className="relative hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#A58B5C] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
          <button aria-label="User Profile" onClick={() => goPage('account')} className="hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          {isAdmin && (
            <button aria-label="Admin Dashboard" onClick={() => goPage('adminDashboard')} className="hover:text-black transition-colors hidden md:block">
              <span className="material-symbols-outlined transition-transform duration-300 hover:scale-110">admin_panel_settings</span>
            </button>
          )}
          {isStaff && (
            <button aria-label="Staff Dashboard" onClick={() => goPage('staffDashboard')} className="hover:text-black transition-colors hidden md:block">
              <span className="material-symbols-outlined transition-transform duration-300 hover:scale-110">assignment_return</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden hover:text-black transition-colors"
            aria-label="Mở menu di động"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#cfc4c5] bg-[#f9f9f9] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] ${
                  link.page === currentPage ? 'text-[#A58B5C]' : 'text-[#5f5e5e]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <button
                onClick={() => goPage('adminDashboard')}
                className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#A58B5C]"
              >
                Admin
              </button>
            )}
            {isStaff && (
              <button
                onClick={() => goPage('staffDashboard')}
                className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e]"
              >
                Nhân viên
              </button>
            )}
            <button
              onClick={() => goPage('account')}
              className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e]"
            >
              Tài khoản
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
