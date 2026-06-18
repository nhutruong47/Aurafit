const fallbackItems = [
  {
    name: 'Avant-Garde Evening Blazer',
    size: 'Size: 48 (EU)',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85',
  },
  {
    name: 'Sculptural Leather Orbit Boots',
    size: 'Size: 42 (EU)',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=85',
  },
];

const navLinks = ['Cosplay', 'Events', 'Yearbook', 'Shop'];

export default function OrderSuccess({ cartItems = [], onNavigate }) {
  const items = cartItems.length
    ? cartItems.map((item) => ({
        name: item.name,
        size: item.name?.toLowerCase().includes('gown') || item.name?.toLowerCase().includes('dress')
          ? 'Size: 38 (EU)'
          : 'One Size',
        image: item.image,
      }))
    : fallbackItems;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9] px-5 md:px-20">
        <button onClick={() => onNavigate?.('home')} className="font-serif text-3xl uppercase tracking-[0.2em] text-black">
          AuraFit
        </button>
        <nav className="hidden items-center space-x-12 md:flex">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => onNavigate?.('home')}
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

      <main className="pt-20">
        <section className="relative flex h-[614px] w-full items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              className="h-full w-full animate-[subtleZoom_20s_linear_infinite_alternate] object-cover opacity-20 grayscale"
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85"
              alt="Minimalist fashion atelier"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f9f9f9]/0 to-[#f9f9f9]" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-[#99854e]">
                <span className="material-symbols-outlined text-4xl text-[#99854e]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
            </div>
            <h1 className="mb-4 font-serif text-[64px] font-normal leading-tight">Confirmed.</h1>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Order #VR-88291039</p>
            <p className="mx-auto mt-6 max-w-lg text-lg font-light leading-8 text-[#5f5e5e]">
              Thank you for choosing AuraFit. Your selection is being meticulously prepared by our artisans.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-20 md:grid-cols-12 md:px-20">
          <div className="space-y-12 md:col-span-7">
            <div className="border-b border-[#cfc4c5] pb-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em]">Your Selection</h2>
            </div>
            <div className="space-y-16">
              {items.map((item) => (
                <ConfirmedItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          <aside className="md:col-span-5">
            <div className="sticky top-32 space-y-12">
              <div className="border border-[#cfc4c5] bg-white p-10">
                <h2 className="mb-8 border-b border-[#cfc4c5] pb-4 text-[12px] font-semibold uppercase tracking-[0.2em]">
                  Concierge Delivery
                </h2>
                <div className="space-y-8">
                  <InfoRow icon="parking_valet" title="Service Type" value="White Glove Concierge" />
                  <InfoRow icon="location_on" title="Destination" value={<>The Ritz-Carlton, Suite 402<br />Avenue Montaigne, Paris</>} />
                  <InfoRow
                    icon="info"
                    title="Instructions"
                    value="Our courier will arrive between 9:00 AM and 11:00 AM. Please ensure someone is available to sign for the garments. Hangers and protective covers are included and must be returned."
                    muted
                  />
                </div>
                <button className="mt-12 w-full bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]">
                  Contact Concierge
                </button>
              </div>

              <div className="px-10">
                <SmallSummary label="Subtotal" value="€1,450.00" />
                <SmallSummary label="Concierge Fee" value="Included" />
                <div className="mt-4 flex items-center justify-between border-t border-[#cfc4c5] pt-4">
                  <span className="text-[12px] font-bold uppercase tracking-[0.15em]">Total Paid</span>
                  <span className="font-serif text-3xl">€1,450.00</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="bg-[#f7f7f7] px-5 py-28 text-center md:px-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 font-serif text-5xl font-normal">Extend your story.</h2>
            <p className="mb-12 text-lg font-light leading-8 text-[#5f5e5e]">
              Capture your journey and tag us. Exceptional entries are featured in our seasonal Yearbook.
            </p>
            <div className="flex justify-center gap-12">
              {['Instagram', 'Editorial'].map((link) => (
                <a key={link} className="border-b border-black pb-1 text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:border-[#99854e] hover:text-[#99854e]" href="#">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-40 flex w-full flex-col items-start justify-between border-t border-[#cfc4c5] bg-[#f9f9f9] px-5 py-20 md:flex-row md:px-20">
        <div className="mb-12 md:mb-0">
          <div className="mb-8 font-serif text-3xl text-black">AuraFit</div>
          <div className="text-sm tracking-widest text-gray-500 uppercase">
            © 2026 AuraFit. Designed for the extraordinary.
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-8 md:grid-cols-3 md:gap-x-24">
          <FooterColumn title="Inquiries" links={['Contact', 'FAQ']} />
          <FooterColumn title="Legal" links={['Terms', 'Sustainability']} />
          <FooterColumn title="Brand" links={['About']} />
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-[#cfc4c5] bg-[#f9f9f9] px-4 md:hidden">
        {[
          ['theater_comedy', 'Cosplay'],
          ['event', 'Events'],
          ['menu_book', 'Yearbook'],
          ['auto_awesome', 'Shop'],
        ].map(([icon, label]) => (
          <button key={label} className="flex flex-col items-center justify-center p-2 text-[#5f5e5e]">
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmedItem({ item }) {
  return (
    <div className="group flex flex-col gap-8 md:flex-row">
      <div className="h-64 w-full overflow-hidden bg-[#f7f7f7] md:w-48">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-col justify-between py-2">
        <div>
          <h3 className="mb-2 font-serif text-3xl font-normal">{item.name}</h3>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{item.size}</p>
        </div>
        <div className="space-y-2">
          <IconText icon="calendar_today" text="Rental: Oct 24 - Oct 28" />
          <IconText icon="assignment_return" text="Return by: Oct 29, 11:00 AM" accent />
        </div>
      </div>
    </div>
  );
}

function IconText({ icon, text, accent = false }) {
  return (
    <div className={`flex items-center gap-2 ${accent ? 'text-[#99854e]' : ''}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">{text}</span>
    </div>
  );
}

function InfoRow({ icon, title, value, muted = false }) {
  return (
    <div className="flex gap-4">
      <span className="material-symbols-outlined text-[#99854e]">{icon}</span>
      <div>
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.15em]">{title}</p>
        <p className={`leading-6 ${muted ? 'text-[#5f5e5e]' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function SmallSummary({ label, value }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-black">{title}</span>
      {links.map((link) => (
        <a key={link} className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e] underline decoration-[#99854e] underline-offset-4 transition hover:text-[#99854e]" href="#">
          {link}
        </a>
      ))}
    </div>
  );
}
