// Footer va mobile navigation cho trang dat hang thanh cong.
function FooterColumn({ title, links }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-black">{title}</span>
      {links.map((link) => (
        <a
          key={link}
          className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e] underline decoration-[#99854e] underline-offset-4 transition hover:text-[#99854e]"
          href="#"
        >
          {link}
        </a>
      ))}
    </div>
  );
}

export default function OrderSuccessFooter({ footerColumns, mobileNavLinks, onNavigate }) {
  return (
    <>
      <footer className="mt-40 flex w-full flex-col items-start justify-between border-t border-[#cfc4c5] bg-[#f9f9f9] px-5 py-20 md:flex-row md:px-20">
        <div className="mb-12 md:mb-0">
          <div className="mb-8 font-serif text-3xl text-black">AuraFit</div>
          <div className="text-sm uppercase tracking-widest text-gray-500">© 2026 AuraFit. Thiết kế cho những khoảnh khắc khác biệt.</div>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-8 md:grid-cols-3 md:gap-x-24">
          {footerColumns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-[#cfc4c5] bg-[#f9f9f9] px-4 md:hidden">
        {mobileNavLinks.map(([icon, label]) => (
          <button
            key={label}
            onClick={() => onNavigate?.(label === 'Shop' ? 'shop' : label === 'Sự kiện' ? 'events' : label.toLowerCase())}
            className="flex flex-col items-center justify-center p-2 text-[#5f5e5e]"
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
