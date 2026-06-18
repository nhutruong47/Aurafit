const footerColumns = [
  {
    title: 'Company',
    links: [
      { label: 'About', page: 'home' },
      { label: 'Sustainability', page: 'home' },
      { label: 'Terms', page: 'care' },
    ],
  },
  {
    title: 'Client Services',
    links: [
      { label: 'Contact', page: 'care', section: 'stylists' },
      { label: 'FAQ', page: 'care' },
      { label: 'Shipping', page: 'care', section: 'shipping' },
    ],
  },
];

export default function Footer({ onNavigate }) {
  const navigateFooter = (link) => {
    onNavigate?.(link.page);

    if (link.section) {
      window.setTimeout(() => {
        document.getElementById(link.section)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }
  };

  return (
    <footer className="w-full border-t border-[#cfc4c5] bg-[#f9f9f9] px-5 py-20 md:px-20">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-12 md:flex-row">
        <div className="max-w-xs">
          <h2 className="mb-8 font-serif text-3xl uppercase tracking-[0.2em] text-black">AuraFit</h2>
          <p className="leading-relaxed text-[#5f5e5e]">
            Redefining luxury through the lens of curation and circularity. Wear the extraordinary, every day.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 md:grid-cols-3 md:gap-16">
          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-4">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-black">{column.title}</p>
              {column.links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigateFooter(link)}
                  className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e] transition hover:text-[#99854e]"
                >
                  {link.label}
                </button>
              ))}
            </div>
          ))}

          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-black">Connect</p>
            <div className="flex gap-4">
              {['share', 'mail'].map((icon) => (
                <a key={icon} className="cursor-pointer text-[#5f5e5e] transition hover:text-[#99854e]" href="#">
                  <span className="material-symbols-outlined">{icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full border-t border-[#cfc4c5] pt-8 md:hidden">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#999999]">
            © 2026 AuraFit. Designed for the extraordinary.
          </p>
        </div>
      </div>
    </footer>
  );
}
