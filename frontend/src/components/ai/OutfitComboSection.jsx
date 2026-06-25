import EmptyState from '../ui/EmptyState';

export default function OutfitComboSection({ title, items, isLoading = false, onNavigate, onTrackClick }) {
  if (isLoading) {
    return (
      <section className="mt-8 border border-[#d7d2c8] bg-white p-6">
        <p className="text-sm text-[#5f5e5e]">Dang tai goi y combo...</p>
      </section>
    );
  }

  if (!items?.length) {
    return (
      <section className="mt-8 border border-[#d7d2c8] bg-white p-6">
        <EmptyState icon="styler" title="Outfit Combo" message="Chua co combo de xuat cho san pham nay." />
      </section>
    );
  }

  return (
    <section className="mt-8 border border-[#d7d2c8] bg-white p-6">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Outfit Combo</p>
        <h2 className="mt-2 font-serif text-3xl italic">{title || 'Goi y mix & match'}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.product.id} className="border border-[#ebe7df] bg-[#fafaf8] p-4">
            <img src={item.product.image} alt={item.product.name} className="aspect-[3/4] w-full object-cover" />
            <h3 className="mt-4 font-serif text-2xl italic">{item.product.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">{item.reason}</p>
            <button
              onClick={() => {
                onTrackClick?.(item);
                onNavigate?.('productDetail', item.product);
              }}
              className="mt-4 w-full border border-black px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
            >
              Xem goi y
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
