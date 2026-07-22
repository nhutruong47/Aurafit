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

  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center text-[#f4ecdc] transition hover:text-[#eadcae] focus:outline-none focus:ring-2 focus:ring-[#eadcae]/40';

  return (
    <header className="sticky top-0 z-50 h-20 w-full border-b border-[#7f7041]/70 bg-[#473a33] shadow-[0_4px_18px_rgba(41,34,29,0.16)]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 md:px-20">
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="flex items-center"
            aria-label="Về trang chủ AuraFit"
          >
            <img
              src="/LogoAF.png"
              alt="AuraFit"
              className="h-16 w-auto object-contain"
            />
          </Link>

          <nav className="hidden gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:text-[#eadcae] ${
                  link.page === currentPage ? 'text-[#eadcae]' : 'text-[#f4ecdc]/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => {
              onSearchOpen?.();
              setMobileMenuOpen(false);
            }}
            className={`${iconButtonClass} ${currentPage === 'catalog' ? 'text-[#eadcae]' : ''}`}
            aria-label="Tìm kiếm"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <button
            onClick={() => {
              onNavigate('chat', null, { state: { startNewChatAt: Date.now() } });
              setMobileMenuOpen(false);
            }}
            className={`${iconButtonClass} ${currentPage === 'chat' ? 'text-[#eadcae]' : ''}`}
            aria-label="Trò chuyện với AuraFit Stylist"
          >
            <span
              className="material-symbols-outlined"
              style={currentPage === 'chat' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              forum
            </span>
          </button>
          <button
            onClick={() => goPage('checkout')}
            className={`${iconButtonClass} group relative ${currentPage === 'checkout' ? 'text-[#eadcae]' : ''}`}
            aria-label="Giỏ hàng"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9ae68] text-[10px] font-semibold text-[#302721] ring-2 ring-[#473a33]">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => goPage('orders')}
            className={`${iconButtonClass} ${currentPage === 'orders' ? 'text-[#eadcae]' : ''}`}
            aria-label="Đơn hàng"
          >
            <span
              className="material-symbols-outlined"
              style={currentPage === 'orders' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              receipt_long
            </span>
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
              <span
                className="material-symbols-outlined"
                style={currentPage === 'staffDashboard' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                assignment_return
              </span>
            </button>
          )}
          <button
            onClick={() => goPage('account')}
            className={`${iconButtonClass} hidden md:flex ${currentPage === 'account' ? 'text-[#eadcae]' : ''}`}
            aria-label="Tài khoản"
          >
            <span
              className="material-symbols-outlined"
              style={currentPage === 'account' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              person
            </span>
          </button>
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center text-[#f4ecdc] transition hover:text-[#eadcae] md:hidden"
            aria-label="Mở menu di động"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#7f7041]/70 bg-[#473a33] px-5 py-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] ${
                  link.page === currentPage ? 'text-[#eadcae]' : 'text-[#f4ecdc]/80'
                }`}
              >
                {link.label}
              </Link>
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
    </header>
  );
}
