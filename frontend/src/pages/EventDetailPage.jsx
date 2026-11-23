import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEventBySlug } from '../services/eventService';
import { formatCurrency } from '../utils/formatCurrency';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDiscount = (value) => {
  const discount = Number(value);
  return Number.isFinite(discount) ? discount.toLocaleString('vi-VN') : null;
};

function CostumeOfferCard({ costume }) {
  const discount = formatDiscount(costume.appliedDiscountPercent);
  const hasDiscount = discount && Number(costume.finalPrice) < Number(costume.rentalPrice);

  return (
    <article className="group overflow-hidden rounded-lg border border-[#d8caa8] bg-[#FFFCF7] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <Link to={`/products/${encodeURIComponent(costume.costumeId)}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#e5ddcc] to-[#b6a47b]">
          {costume.imageUrl && (
            <img
              src={costume.imageUrl}
              alt={costume.costumeName}
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
              onError={(imageEvent) => {
                imageEvent.currentTarget.style.display = 'none';
              }}
            />
          )}
          {discount && (
            <span className="absolute left-4 top-4 rounded-full bg-[#3A302A]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8D3A9] backdrop-blur-sm">
              Giảm {discount}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-serif text-2xl italic leading-tight text-[#2B2521] transition group-hover:text-[#756536]">
            {costume.costumeName}
          </h3>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d8378]">Giá thuê</p>
              {hasDiscount ? (
                <>
                  <p className="mt-1 text-xs text-[#8d8378] line-through">{formatCurrency(costume.rentalPrice)}</p>
                  <p className="mt-1 font-serif text-2xl text-[#756536]">{formatCurrency(costume.finalPrice)}</p>
                </>
              ) : (
                <p className="mt-1 font-serif text-2xl text-[#2B2521]">{formatCurrency(costume.rentalPrice)}</p>
              )}
            </div>
            <span className="material-symbols-outlined text-[#756536] transition group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function EventDetailPage() {
  const { eventSlug } = useParams();
  const [result, setResult] = useState({
    slug: null,
    event: null,
    error: '',
  });

  useEffect(() => {
    let isMounted = true;

    fetchEventBySlug(eventSlug)
      .then((event) => {
        if (isMounted) {
          const now = Date.now();
          const isOngoing =
            new Date(event.startDate).getTime() <= now
            && new Date(event.endDate).getTime() >= now;
          setResult({
            slug: eventSlug,
            event: { ...event, isOngoing },
            error: '',
          });
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setResult({
            slug: eventSlug,
            event: null,
            error: requestError.message || 'Không thể tải chi tiết chương trình.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [eventSlug]);

  const isLoading = result.slug !== eventSlug;
  const event = result.event;
  const isOngoing = event?.isOngoing === true;
  const costumes = Array.isArray(event?.costumes) ? event.costumes : [];
  const discount = formatDiscount(event?.discountPercent);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#F6F1E8] px-5 py-16 md:px-20 md:py-24">
        <div className="mx-auto max-w-[1280px] animate-pulse">
          <div className="aspect-[16/7] rounded-lg bg-[#d9cfbc]" />
          <div className="mt-10 h-5 w-40 bg-[#ded4c2]" />
          <div className="mt-4 h-12 w-3/4 bg-[#d9cfbc]" />
          <div className="mt-6 h-24 max-w-3xl bg-[#e9e1d2]" />
        </div>
      </div>
    );
  }

  if (result.error || !event) {
    return (
      <div className="flex min-h-[70vh] items-center bg-[#F6F1E8] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-lg border border-[#d8caa8] bg-[#FFFCF7] p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-[#756536]">event_busy</span>
          <h1 className="mt-4 font-serif text-4xl italic text-[#2B2521]">Không tìm thấy chương trình</h1>
          <p className="mt-4 text-sm leading-6 text-[#6f675f]">
            {result.error || 'Chương trình không tồn tại hoặc không còn được công khai.'}
          </p>
          <Link
            to="/events"
            className="mt-7 inline-flex bg-[#3A302A] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F6F1E8] transition hover:bg-[#756536]"
          >
            Quay lại Chương trình
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F6F1E8] text-[#2B2521]">
      <section className="px-5 pb-16 pt-8 md:px-20 md:pb-24">
        <div className="mx-auto max-w-[1280px]">
          <Link
            to="/events"
            className="mb-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#756536] transition hover:text-[#2B2521]"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Tất cả chương trình
          </Link>

          <div className="relative min-h-[360px] overflow-hidden rounded-lg bg-gradient-to-br from-[#8f7948] via-[#6f5e35] to-[#2B2521] shadow-md md:aspect-[3/1] md:min-h-0">
            {event.bannerImageUrl && (
              <img
                src={event.bannerImageUrl}
                alt={event.name}
                className="absolute inset-0 h-full w-full object-contain object-center"
                onError={(imageEvent) => {
                  imageEvent.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] ${
                  isOngoing ? 'bg-[#c9ae68] text-[#2B2521]' : 'bg-white/90 text-[#6f5e35]'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isOngoing ? 'bg-[#3A302A]' : 'bg-[#c9ae68]'}`} />
                {isOngoing ? 'Đang diễn ra' : 'Sắp ra mắt'}
              </span>
              <div className="mt-2 flex min-w-0 items-baseline gap-3 md:gap-5">
                <h1 className="min-w-0 flex-1 truncate font-serif text-2xl italic leading-tight md:text-4xl">
                  {event.name}
                </h1>
                {discount && (
                  <p className="shrink-0 whitespace-nowrap font-serif text-lg text-[#E8D3A9] md:text-2xl">
                    Ưu đãi đến {discount}%
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#756536]">
                Thông tin chương trình
              </p>
              <h2 className="mt-3 font-serif text-4xl italic">Về chương trình này</h2>
              <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#6B6259] md:text-base">
                {event.description || 'Chương trình chưa có mô tả chi tiết.'}
              </p>
            </div>

            <aside className="rounded-lg border border-[#d8caa8] bg-[#FFFCF7] p-6 shadow-sm">
              <dl className="space-y-5 text-sm">
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d8378]">Bắt đầu</dt>
                  <dd className="mt-1 font-medium text-[#2B2521]">{formatDateTime(event.startDate)}</dd>
                </div>
                <div className="border-t border-[#e5ddcc] pt-5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d8378]">Kết thúc</dt>
                  <dd className="mt-1 font-medium text-[#2B2521]">{formatDateTime(event.endDate)}</dd>
                </div>
                <div className="border-t border-[#e5ddcc] pt-5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8d8378]">Sản phẩm áp dụng</dt>
                  <dd className="mt-1 font-serif text-3xl text-[#756536]">{costumes.length}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d8caa8]/70 bg-[#efe9de] px-5 py-16 md:px-20 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#756536]">Ưu đãi áp dụng</p>
            <h2 className="mt-3 font-serif text-4xl italic md:text-5xl">Thiết kế trong chương trình</h2>
          </div>

          {costumes.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {costumes.map((costume) => (
                <CostumeOfferCard key={costume.id} costume={costume} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#c9bb98] bg-[#FFFCF7] px-6 py-12 text-center text-sm text-[#6f675f]">
              Chương trình này hiện chưa có sản phẩm được công khai.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
