import { useState } from 'react';

export default function Navbar({
  currentPage,
  onNavigate,
  onSearchOpen,
  cartCount = 0,
  currentUser,
  isAdmin = false,
  isStaff = false,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLessor = currentUser?.role?.split(',').some((role) => role.trim() === 'LESSOR');

  const goHomeSection = (sectionId) => {
    if (currentPage !== 'home') {
      onNavigate('home');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const goPage = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const navLinks = isAdmin ? [] : [
    { label: 'Cosplay', page: 'cosplay', action: () => goPage('cosplay') },
    { label: 'Events', page: 'events', action: () => goPage('events') },
    { label: 'Yearbook', page: 'yearbook', action: () => goPage('yearbook') },
    { label: 'Shop', page: 'shop', action: () => goPage('shop') },
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
          {!isAdmin && (
            <>
              <button
                onClick={() => {
                  onSearchOpen?.();
                  setMobileMenuOpen(false);
                }}
                className={`${iconButtonClass} ${currentPage === 'catalog' ? 'text-[#99854e]' : ''}`}
                aria-label="Search"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
              <button
                onClick={() => goPage('checkout')}
                className={`${iconButtonClass} group relative ${currentPage === 'checkout' ? 'text-[#99854e]' : ''}`}
                aria-label="Shopping bag"
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
                aria-label="Messages"
              >
                <span className="material-symbols-outlined" style={currentPage === 'chat' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  forum
                </span>
              </button>
              <button
                onClick={() => goPage('orders')}
                className={`${iconButtonClass} ${currentPage === 'orders' ? 'text-[#99854e]' : ''}`}
                aria-label="Orders"
              >
                <span className="material-symbols-outlined" style={currentPage === 'orders' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  receipt_long
                </span>
              </button>
              {isLessor && (
                <button
                  onClick={() => goPage('sellerDashboard')}
                  className={`${iconButtonClass} hidden md:flex ${
                    currentPage === 'sellerDashboard' ? 'text-[#99854e]' : ''
                  }`}
                  aria-label="Kênh Người Bán"
                  title="Kênh Người Bán"
                >
                  <span
                    className="material-symbols-outlined"
                    style={currentPage === 'sellerDashboard' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    storefront
                  </span>
                </button>
              )}
            </>
          )}
          {isAdmin && (
            <button
              onClick={() => goPage('adminDashboard')}
              className={`${iconButtonClass} hidden md:flex ${currentPage === 'adminDashboard' ? 'text-[#99854e]' : ''}`}
              aria-label="Admin dashboard"
              title="Admin dashboard"
            >
              <span
                className="material-symbols-outlined"
                style={currentPage === 'adminDashboard' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                admin_panel_settings
              </span>
            </button>
          )}
          {isStaff && (
            <button
              onClick={() => goPage('staffDashboard')}
              className={`${iconButtonClass} hidden md:flex ${currentPage === 'staffDashboard' ? 'text-[#99854e]' : ''}`}
              aria-label="Staff handover"
              title="Staff handover"
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
            aria-label="Account"
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
            aria-label="Open mobile menu"
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
          </div>
        </div>
      )}
    </header>
  );
}
