import { Link } from 'react-router-dom';

const formatDayMonth = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const formatDiscount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const discount = Number(value);
  return Number.isFinite(discount) ? discount.toLocaleString('vi-VN') : null;
};

export default function EventSideBanner({ side, event }) {
  if (!event) return null;

  const discount = formatDiscount(event.discountPercent);
  const eventPath = event.slug
    ? `/events/${encodeURIComponent(event.slug)}`
    : '/events';
  const alignmentClass = side === 'left' ? 'items-end text-right' : 'items-start text-left';

  return (
    <div className="flex h-full min-h-0 justify-center" data-event-banner-rail={side}>
      <Link
        to={eventPath}
        state={{ event }}
        aria-label={`Xem sự kiện ${event.name}`}
        data-event-banner-card={side}
        className="group sticky top-24 flex h-[calc(100vh-7rem)] max-h-full w-full max-w-[420px] overflow-hidden rounded-lg border border-[#c9bb98] bg-[#29261f] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#9b8248] via-[#6f5e35] to-[#211f1a]" />
        {event.sideBannerImageUrl && (
          <img
            src={event.sideBannerImageUrl}
            alt=""
            className="absolute inset-0 block h-full w-full object-contain object-top"
            onError={(imageEvent) => {
              imageEvent.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent via-black/55 to-black/90" />

        <div className={`relative flex h-full w-full flex-col justify-end p-4 pt-6 text-white ${alignmentClass}`}>
          <span
            className={`mb-auto inline-flex w-fit px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm ${
              event.isOngoing
                ? 'bg-[#99854e] text-white'
                : 'bg-white/90 text-[#6f5e35]'
            }`}
          >
            {event.isOngoing ? 'Đang diễn ra' : 'Sắp diễn ra'}
          </span>

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {formatDayMonth(event.startDate)} – {formatDayMonth(event.endDate)}
          </p>
          <h2 className="mt-2 font-serif text-2xl italic leading-tight">{event.name}</h2>
          <p className="mt-3 text-sm font-semibold text-[#eadcae]">
            {discount ? `Giảm đến ${discount}%` : 'Ưu đãi đặc biệt'}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
            Xem sự kiện
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </span>
        </div>
      </Link>
    </div>
  );
}
