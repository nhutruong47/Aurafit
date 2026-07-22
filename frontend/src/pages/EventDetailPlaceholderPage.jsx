import { Link, useLocation, useParams } from 'react-router-dom';

const humanizeSlug = (slug) => {
  if (!slug) return 'Sự kiện AuraFit';
  return decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function EventDetailPlaceholderPage() {
  const location = useLocation();
  const { eventSlug } = useParams();
  const event = location.state?.event;
  const eventName = event?.name || humanizeSlug(eventSlug);

  return (
    <section className="min-h-[70vh] bg-[#f9f9f9] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl border border-[#d7d2c8] bg-[#fdfdfb] p-8 text-center shadow-[0_16px_50px_rgba(61,51,31,0.08)] sm:p-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">
          AuraFit Event
        </p>
        <h1 className="mt-4 font-serif text-4xl italic text-black sm:text-5xl">{eventName}</h1>
        {event?.discountPercent && (
          <p className="mt-5 text-lg font-semibold text-[#7f7041]">
            Ưu đãi đến {Number(event.discountPercent).toLocaleString('vi-VN')}%
          </p>
        )}
        <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#5f5e5e]">
          Trang chi tiết sự kiện đang được hoàn thiện. Bạn vẫn có thể xem toàn bộ trang phục hiện có trong Bộ sưu tập.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/catalog"
            className="bg-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#7f7041]"
          >
            Xem bộ sưu tập
          </Link>
          <Link
            to="/events"
            className="border border-[#7f7041] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f5e35] transition hover:bg-[#f1ead8]"
          >
            Trang phục sự kiện
          </Link>
        </div>
      </div>
    </section>
  );
}
