import { formatCurrency } from '../../utils/formatCurrency';
import EmptyState from '../ui/EmptyState';

export default function PersonalizedRecommendationSection({
  title = 'De xuat ca nhan hoa',
  subtitle,
  items,
  isLoading = false,
  emptyMessage = 'Chua co du lieu goi y phu hop.',
  onNavigate,
  onTrackClick,
}) {
  if (isLoading) {
    return (
      <section className="border border-[#d7d2c8] bg-white p-6">
        <p className="text-sm text-[#5f5e5e]">Dang tai recommendation...</p>
      </section>
    );
  }

  if (!items?.length) {
    return (
      <section className="border border-[#d7d2c8] bg-white p-6">
        <EmptyState icon="auto_awesome" title={title} message={emptyMessage} />
      </section>
    );
  }

  return (
    <section className="border border-[#d7d2c8] bg-white p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">{title}</p>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5e5e]">{subtitle}</p>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.product.id} className="border border-[#ebe7df] bg-[#fafaf8] p-4">
            <div className="aspect-[3/4] overflow-hidden bg-[#eeeeee]">
              <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#99854e]">
              {item.product.category}
            </p>
            <h3 className="mt-2 font-serif text-2xl italic leading-tight">{item.product.name}</h3>
            <p className="mt-2 text-sm font-medium text-black">{formatCurrency(item.product.priceValue)}</p>
            <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#5f5e5e]">{item.reason}</p>
            <button
              onClick={() => {
                onTrackClick?.(item);
                onNavigate?.('productDetail', item.product);
              }}
              className="mt-4 w-full border border-black px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
            >
              Xem san pham
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
