import { useState } from 'react';
import { Link } from 'react-router-dom';
import NavbarSearch from './NavbarSearch';

export default function Navbar({
  currentPage,
  onNavigate,
  onSearchOpen,
  cartCount = 0,
  isAdmin = false,
  isStaff = false,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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

  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center text-[#f4ecdc] transition hover:text-[#eadcae] focus:outline-none focus:ring-2 focus:ring-[#eadcae]/40';

  return (
    <header className="sticky top-0 z-50 h-20 w-full border-b border-[#7f7041]/70 bg-[#473a33] shadow-[0_4px_18px_rgba(41,34,29,0.16)]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 md:px-20">

        {/* Logo Area */}
        <div className="flex items-center gap-10">
          <button
            onClick={() => goPage('home')}
            className="flex items-center"
            aria-label="Về trang chủ AuraFit"
          >
            <img
              src="/LogoAF.png"
              alt="AuraFit"
              className="h-16 w-auto object-contain"
            />
          </button>

          {/* Navigation Links - Lê's exact layout restored with Teammate's colors */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-x-8 text-[12px] font-semibold tracking-[0.15em] text-[#f4ecdc]/80">
              <li>
                <button
                  onClick={() => goPage('home')}
                  className={`hover:text-[#eadcae] px-4 py-2 rounded-full transition-all duration-300 uppercase ${currentPage === 'home' ? 'text-[#eadcae]' : ''}`}
                >
                  Trang Chủ
                </button>
              </li>
              <li className="relative group py-2">
                <button
                  onClick={() => goPage('catalog')}
                  className={`hover:text-[#eadcae] px-4 py-2 rounded-full transition-all duration-300 uppercase flex items-center gap-1 ${currentPage === 'catalog' ? 'text-[#eadcae]' : ''}`}
                >
                  Bộ Sưu Tập
                </button>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#473a33] border border-[#7f7041]/70 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 py-2">
                  <ul className="flex flex-col">
                    <li><button onClick={() => goPage('cosplay')} className="block w-full text-left px-6 py-2 hover:bg-[#3b2f29] hover:text-[#eadcae] transition-colors text-[12px] uppercase tracking-[0.15em]">Cosplay</button></li>
                    <li><button onClick={() => goPage('events')} className="block w-full text-left px-6 py-2 hover:bg-[#3b2f29] hover:text-[#eadcae] transition-colors text-[12px] uppercase tracking-[0.15em]">Sự kiện</button></li>
                    <li><button onClick={() => goPage('traditional')} className="block w-full text-left px-6 py-2 hover:bg-[#3b2f29] hover:text-[#eadcae] transition-colors text-[12px] uppercase tracking-[0.15em]">Truyền thống</button></li>
                    <li><button onClick={() => goPage('yearbook')} className="block w-full text-left px-6 py-2 hover:bg-[#3b2f29] hover:text-[#eadcae] transition-colors text-[12px] uppercase tracking-[0.15em]">Yearbook</button></li>
                  </ul>
                </div>
              </li>
              <li>
                <button
                  onClick={() => goPage('care')}
                  className={`hover:text-[#eadcae] px-4 py-2 rounded-full transition-all duration-300 uppercase ${currentPage === 'care' ? 'text-[#eadcae]' : ''}`}
                >
                  Giới Thiệu
                </button>
              </li>
              <li>
                <button
                  onClick={() => goPage('policy')}
                  className={`hover:text-[#eadcae] px-4 py-2 rounded-full transition-all duration-300 uppercase ${currentPage === 'policy' ? 'text-[#eadcae]' : ''}`}
                >
                  Chính Sách Thuê
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Action Icons - Lê's SVGs restored with Teammate's colors */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => {
              setIsSearchModalOpen(prev => !prev);
              setMobileMenuOpen(false);
            }}
            className={`${iconButtonClass} ${currentPage === 'catalog' ? 'text-[#eadcae]' : ''}`}
            aria-label="Tìm kiếm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>

          <button
            onClick={() => {
              onNavigate('chat', null, { state: { startNewChatAt: Date.now() } });
              setMobileMenuOpen(false);
            }}
            className={`${iconButtonClass} ${currentPage === 'chat' ? 'text-[#eadcae]' : ''}`}
            aria-label="Trò chuyện với AuraFit Stylist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>

          <button
            onClick={() => goPage('orders')}
            className={`${iconButtonClass} ${currentPage === 'orders' ? 'text-[#eadcae]' : ''}`}
            aria-label="Đơn hàng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>

          <button
            onClick={() => goPage('checkout')}
            className={`${iconButtonClass} group relative ${currentPage === 'checkout' ? 'text-[#eadcae]' : ''}`}
            aria-label="Giỏ hàng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9ae68] text-[10px] font-semibold text-[#302721] ring-2 ring-[#473a33]">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => goPage('account')}
            className={`${iconButtonClass} hidden md:flex ${currentPage === 'account' ? 'text-[#eadcae]' : ''}`}
            aria-label="Tài khoản"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>

          {isAdmin && (
            <button
              onClick={() => goPage('adminDashboard')}
              className={`${iconButtonClass} hidden md:flex ${currentPage === 'adminDashboard' ? 'text-[#eadcae]' : ''}`}
              aria-label="Bảng điều khiển Admin"
              title="Bảng điều khiển Admin"
            >
              <span className="material-symbols-outlined transition-transform duration-300 hover:scale-110">
                admin_panel_settings
              </span>
            </button>
          )}

          {isStaff && (
            <button
              onClick={() => goPage('staffDashboard')}
              className={`${iconButtonClass} hidden md:flex ${currentPage === 'staffDashboard' ? 'text-[#eadcae]' : ''}`}
              aria-label="Bàn giao nhân viên"
              title="Bàn giao nhân viên"
            >
              <span className="material-symbols-outlined transition-transform duration-300 hover:scale-110">
                assignment_return
              </span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center text-[#f4ecdc] transition hover:text-[#eadcae] md:hidden"
            aria-label="Mở menu di động"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#7f7041]/70 bg-[#473a33] px-5 py-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => goPage(link.page)}
                className={`py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] ${link.page === currentPage ? 'text-[#eadcae]' : 'text-[#f4ecdc]/80'
                  }`}
              >
                {link.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => goPage('adminDashboard')}
                className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#eadcae]"
              >
                Admin
              </button>
            )}
            {isStaff && (
              <button
                onClick={() => goPage('staffDashboard')}
                className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#f4ecdc]/80"
              >
                Nhân viên
              </button>
            )}
            <button
              onClick={() => goPage('account')}
              className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#f4ecdc]/80"
            >
              Tài khoản
            </button>
          </div>
        </div>
      )}
      <NavbarSearch 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
}
