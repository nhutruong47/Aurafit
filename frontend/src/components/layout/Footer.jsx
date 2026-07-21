// Footer dung chung cua ung dung voi cac lien ket dieu huong.
const footerColumns = [
  {
    title: 'Công ty',
    links: [
      { label: 'Giới thiệu', page: 'about' },
      { label: 'Điều khoản', page: 'policy' },
      { label: 'Chính sách thuê', page: 'policy' },
    ],
  },
  {
    title: 'Hỗ trợ khách hàng',
    links: [
      { label: 'Liên hệ', page: 'about' },
      { label: 'FAQ', page: 'policy' },
      { label: 'Giao nhận', page: 'policy' },
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
            Tái định nghĩa trải nghiệm thuê đồ cao cấp bằng tuyển chọn tinh tế và vòng đời bền vững. Tỏa sáng
            trong mọi khoảnh khắc.
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
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-black">Kết nối</p>
            <p className="text-[13px] leading-relaxed text-[#5f5e5e]">
              📍 Địa chỉ: Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh.
            </p>
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
            © 2026 AuraFit. Thiết kế cho những khoảnh khắc khác biệt.
          </p>
        </div>
      </div>
    </footer>
  );
}
