// Navbar dung chung cua ung dung tren desktop va mobile.
import { useState } from 'react';

export default function Navbar({
  currentPage,
  onNavigate,
  onSearchOpen,
  cartCount = 0,
  isAdmin = false,
  isSeller = false,
  isStaff = false,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goPage = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Bộ sưu tập', page: 'catalog', action: () => goPage('catalog') },
    { label: 'Cosplay', page: 'cosplay', action: () => goPage('cosplay') },
    { label: 'Sự kiện', page: 'events', action: () => goPage('events') },
    { label: 'Truyền thống', page: 'traditional', action: () => goPage('traditional') },
    { label: 'Yearbook', page: 'yearbook', action: () => goPage('yearbook') },
  ];

  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center transition hover:text-[#99854e] focus:outline-none focus:ring-2 focus:ring-[#99854e]/30';

  return (
    <header className="sticky top-0 z-50 h-20 w-full border-b border-[#cfc4c5] bg-[#f9f9f9]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 md:px-20">
        <div className="flex items-center gap-10">
          <button
            onClick={() => onNavigate('home')}
            className="font-serif text-[28px] uppercase tracking-[0.2em] text-black"
          >
            AuraFit
          </button>

          <nav className="hidden gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                className={`text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:text-[#99854e] ${
                  link.page === currentPage ? 'text-[#99854e]' : 'text-[#5f5e5e]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => {
              onSearchOpen?.();
              setMobileMenuOpen(false);
            }}
            className={`${iconButtonClass} ${currentPage === 'catalog' ? 'text-[#99854e]' : ''}`}
            aria-label="Tìm kiếm"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <button
            onClick={() => goPage('checkout')}
            className={`${iconButtonClass} group relative ${currentPage === 'checkout' ? 'text-[#99854e]' : ''}`}
            aria-label="Giỏ hàng"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#99854e] text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => goPage('chat')}
            className={`${iconButtonClass} ${currentPage === 'chat' ? 'text-[#99854e]' : ''}`}
            aria-label="Chatbot AuraFit"
            title="Chatbot AuraFit"
          >
            <span
              className="material-symbols-outlined"
              style={currentPage === 'chat' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              smart_toy
            </span>
          </button>
          <button
            onClick={() => goPage('orders')}
            className={`${iconButtonClass} ${currentPage === 'orders' ? 'text-[#99854e]' : ''}`}
            aria-label="Đơn hàng"
          >
            <span
              className="material-symbols-outlined"
              style={currentPage === 'orders' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              receipt_long
            </span>
          </button>
          {(isAdmin || isSeller) && (
            <button
              onClick={() => goPage('adminDashboard')}
              className={`${iconButtonClass} hidden md:flex ${currentPage === 'adminDashboard' ? 'text-[#99854e]' : ''}`}
              aria-label={isAdmin ? 'Bảng điều khiển Admin' : 'Khu đăng sản phẩm cho thuê'}
              title={isAdmin ? 'Bảng điều khiển Admin' : 'Khu đăng sản phẩm cho thuê'}
            >
              <span
                className="material-symbols-outlined"
                style={currentPage === 'adminDashboard' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {isAdmin ? 'admin_panel_settings' : 'storefront'}
              </span>
            </button>
          )}
          {isStaff && (
            <button
              onClick={() => goPage('staffDashboard')}
              className={`${iconButtonClass} hidden md:flex ${currentPage === 'staffDashboard' ? 'text-[#99854e]' : ''}`}
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
            className={`${iconButtonClass} hidden md:flex ${currentPage === 'account' ? 'text-[#99854e]' : ''}`}
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
            className="md:hidden"
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
              <button
                key={link.label}
                onClick={link.action}
                className={`py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] ${
                  link.page === currentPage ? 'text-[#99854e]' : 'text-[#5f5e5e]'
                }`}
              >
                {link.label}
              </button>
            ))}
            {(isAdmin || isSeller) && (
              <button
                onClick={() => goPage('adminDashboard')}
                className="py-3 text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-[#99854e]"
              >
                {isAdmin ? 'Admin' : 'Cho thuê'}
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
