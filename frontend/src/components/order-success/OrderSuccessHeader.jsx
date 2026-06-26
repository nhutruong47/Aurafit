// Header co dinh cua trang dat hang thanh cong.
export default function OrderSuccessHeader({ navLinks, onNavigate }) {
  return (
    <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9] px-5 md:px-20">
      <button onClick={() => onNavigate?.('home')} className="font-serif text-3xl uppercase tracking-[0.2em] text-black">
        AuraFit
      </button>
      <nav className="hidden items-center space-x-12 md:flex">
        {navLinks.map((link) => (
          <button
            key={link}
            onClick={() => onNavigate?.(link === 'Shop' ? 'shop' : link === 'Sự kiện' ? 'events' : link.toLowerCase())}
            className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e] transition hover:text-[#99854e]"
          >
            {link}
          </button>
        ))}
      </nav>
      <div className="flex items-center space-x-6">
        {['search', 'shopping_bag', 'person'].map((icon) => (
          <span key={icon} className="material-symbols-outlined cursor-pointer transition hover:text-[#99854e]">
            {icon}
          </span>
        ))}
      </div>
    </header>
  );
}
