import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePrograms } from '../hooks/usePrograms';

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

function ProgramCard({ event }) {
  const discount = formatDiscount(event.discountPercent);
  const eventPath = event.slug ? `/events/${encodeURIComponent(event.slug)}` : '/events';

  return (
    <article className="group overflow-hidden rounded-lg border border-[#d8caa8] bg-[#fffdf8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <Link to={eventPath} state={{ event }} className="grid h-full grid-cols-1 sm:grid-cols-[180px_1fr] lg:grid-cols-1">
        <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-[#8f7948] via-[#6f5e35] to-[#302721] lg:aspect-[3/4]">
          {event.sideBannerImageUrl && (
            <img
              src={event.sideBannerImageUrl}
              alt={event.name}
              className="absolute inset-0 h-full w-full object-contain object-top"
              onError={(imageEvent) => {
                imageEvent.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
          <span
            className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] shadow-sm ${
              event.isOngoing
                ? 'bg-[#c9ae68] text-[#302721]'
                : 'bg-[#fffdf8]/95 text-[#6f5e35]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${event.isOngoing ? 'bg-[#473a33]' : 'bg-[#c9ae68]'}`} />
            {event.isOngoing ? 'Đang diễn ra' : 'Sắp ra mắt'}
          </span>
          {discount && (
            <span className="absolute bottom-4 right-4 rounded-full bg-[#473a33]/90 px-3 py-1.5 text-xs font-bold text-[#eadcae] backdrop-blur-sm">
              Giảm {discount}%
            </span>
          )}
        </div>

        <div className="flex flex-col p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f7948]">
            {event.isOngoing ? 'Kết thúc ngày' : 'Bắt đầu ngày'}{' '}
            {formatDate(event.isOngoing ? event.endDate : event.startDate)}
          </p>
          <h2 className="mt-3 font-serif text-3xl italic leading-tight text-[#302721] transition group-hover:text-[#7f7041]">
            {event.name}
          </h2>
          <div className="mt-5 space-y-2 border-y border-[#e5ddcc] py-4 text-sm text-[#5f5e5e]">
            <div className="flex items-center justify-between gap-4">
              <span>Thời gian</span>
              <span className="font-medium text-[#302721]">
                {formatDate(event.startDate)} — {formatDate(event.endDate)}
              </span>
            </div>
            {discount && (
              <div className="flex items-center justify-between gap-4">
                <span>Ưu đãi</span>
                <span className="font-semibold text-[#7f7041]">Giảm {discount}%</span>
              </div>
            )}
          </div>
          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
            Xem chương trình
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

function ProgramGrid({ events, emptyMessage }) {
  if (!events.length) {
    return (
      <div className="rounded-lg border border-dashed border-[#d8caa8] bg-[#fffdf8] px-6 py-10 text-center text-sm text-[#6f675f]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {events.map((event) => <ProgramCard key={event.id} event={event} />)}
    </div>
  );
}

export default function ProgramsPage() {
  const { events, isLoading, error } = usePrograms();
  const ongoingEvents = useMemo(() => events.filter((event) => event.isOngoing), [events]);
  const upcomingEvents = useMemo(() => events.filter((event) => !event.isOngoing), [events]);

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#302721]">
      <section className="overflow-hidden border-b border-[#7f7041]/40 bg-[#473a33] text-[#f4ecdc]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 md:grid-cols-[1fr_auto] md:items-end md:px-20 md:py-24">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d8c38a]">AuraFit Offers</p>
            <h1 className="mt-4 font-serif text-5xl italic leading-tight md:text-7xl">Chương trình</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#f4ecdc]/70 md:text-base">
              Khám phá các chương trình ưu đãi đang diễn ra và những đợt giảm giá sắp ra mắt tại AuraFit.
            </p>
          </div>
          {!isLoading && !error && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#d8c38a]/35 bg-white/5 px-5 py-4 text-center">
                <strong className="block font-serif text-3xl text-[#eadcae]">{ongoingEvents.length}</strong>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f4ecdc]/65">
                  Đang diễn ra
                </span>
              </div>
              <div className="rounded-lg border border-[#d8c38a]/35 bg-white/5 px-5 py-4 text-center">
                <strong className="block font-serif text-3xl text-[#eadcae]">{upcomingEvents.length}</strong>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f4ecdc]/65">
                  Sắp ra mắt
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] space-y-20 px-5 py-16 md:px-20 md:py-24">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg bg-[#fffdf8] shadow-sm">
                <div className="aspect-[3/4] animate-pulse bg-[#d9cfbc]" />
                <div className="space-y-4 p-6">
                  <div className="h-3 w-1/2 animate-pulse bg-[#e9e1d2]" />
                  <div className="h-8 w-3/4 animate-pulse bg-[#ded4c2]" />
                  <div className="h-16 animate-pulse bg-[#eee8dd]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#d8b7b0] bg-[#fff6f4] px-6 py-5 text-sm text-[#9c453c]">
            {error}
          </div>
        ) : (
          <>
            <section>
              <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">Ưu đãi hiện tại</p>
                <h2 className="mt-3 font-serif text-4xl italic">Đang diễn ra</h2>
              </div>
              <ProgramGrid
                events={ongoingEvents}
                emptyMessage="Hiện chưa có chương trình ưu đãi nào đang diễn ra."
              />
            </section>

            <section>
              <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">Lịch sắp tới</p>
                <h2 className="mt-3 font-serif text-4xl italic">Sắp ra mắt</h2>
              </div>
              <ProgramGrid
                events={upcomingEvents}
                emptyMessage="Hiện chưa có chương trình ưu đãi nào được lên lịch sắp tới."
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
