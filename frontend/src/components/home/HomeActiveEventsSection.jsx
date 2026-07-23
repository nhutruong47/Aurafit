import { Link } from 'react-router-dom';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatDiscount = (value) => {
  const discount = Number(value);
  return Number.isFinite(discount) ? discount.toLocaleString('vi-VN') : null;
};

function EventCard({ event }) {
  const discount = formatDiscount(event.discountPercent);
  const costumeCount = Array.isArray(event.costumes) ? event.costumes.length : 0;
  const eventPath = event.slug ? `/events/${encodeURIComponent(event.slug)}` : '/events';

  return (
    <article className="group overflow-hidden rounded-lg border border-[#d8caa8]/70 bg-[#fffdf8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <Link to={eventPath} state={{ event }} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#8f7948] via-[#6f5e35] to-[#302721]">
          {event.bannerImageUrl && (
            <img
              src={event.bannerImageUrl}
              alt={event.name}
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
              onError={(imageEvent) => {
                imageEvent.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#473a33]/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f4ecdc] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#eadcae]" />
            Đang diễn ra
          </span>
          {discount && (
            <span className="absolute bottom-4 right-4 rounded-full bg-[#c9ae68] px-3 py-1.5 text-xs font-bold text-[#302721] shadow-sm">
              Giảm {discount}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f7948]">
            {formatDate(event.startDate)} — {formatDate(event.endDate)}
          </p>
          <h3 className="mt-3 font-serif text-2xl italic leading-tight text-[#302721] transition group-hover:text-[#7f7041]">
            {event.name}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5f5e5e]">
            {event.description || 'Khám phá các thiết kế và ưu đãi được AuraFit tuyển chọn cho sự kiện này.'}
          </p>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#e5ddcc] pt-5 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <span className="text-[#7b746c]">{costumeCount} sản phẩm áp dụng</span>
            <span className="inline-flex items-center gap-1 text-[#7f7041]">
              Xem sự kiện
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function HomeActiveEventsSection({ events, isLoading, error }) {
  return (
    <section className="bg-[#473a33] py-20 text-[#f4ecdc] md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d8c38a]">
              Ưu đãi hiện tại
            </p>
            <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Sự kiện đang diễn ra</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#f4ecdc]/70">
              Những chương trình đang có hiệu lực, cùng các thiết kế được áp dụng ưu đãi tại AuraFit.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex w-fit items-center gap-2 border-b border-[#d8c38a] pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#eadcae] transition hover:text-white"
          >
            Xem tất cả chương trình
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg bg-[#fffdf8] shadow-sm">
                <div className="aspect-[16/9] animate-pulse bg-[#6f5e35]" />
                <div className="space-y-4 p-6">
                  <div className="h-3 w-1/2 animate-pulse bg-[#e9e1d2]" />
                  <div className="h-7 w-3/4 animate-pulse bg-[#ded4c2]" />
                  <div className="h-16 animate-pulse bg-[#eee8dd]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#d8c38a]/40 bg-[#fffdf8]/10 px-5 py-4 text-sm text-[#f4ecdc]">
            {error}
          </div>
        ) : events.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#d8c38a]/50 bg-[#fffdf8]/5 px-6 py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#d8c38a]">event_busy</span>
            <p className="mt-3 font-serif text-2xl italic">Hiện chưa có sự kiện đang diễn ra</p>
            <p className="mt-2 text-sm text-[#f4ecdc]/65">Bạn có thể xem các ưu đãi sắp tới trên trang Chương trình.</p>
          </div>
        )}
      </div>
    </section>
  );
}
