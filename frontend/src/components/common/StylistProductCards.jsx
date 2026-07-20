import { fallbackCostumeImage, getCostumeImage } from '../../utils/costumeUtils';
import { formatCurrency } from '../../utils/formatCurrency';

function StylistProductCard({ costume, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(costume)}
      className="group w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-[#ded7cb] bg-white text-left shadow-[0_5px_16px_rgba(48,40,24,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#a38b52] hover:shadow-[0_9px_24px_rgba(48,40,24,0.12)] sm:w-44"
      aria-label={`Xem chi tiết ${costume.name}`}
    >
      <div className="relative h-28 overflow-hidden bg-[#eeeeee] sm:h-32">
        <img
          src={getCostumeImage(costume)}
          alt={costume.name}
          onError={(event) => {
            event.currentTarget.src = fallbackCostumeImage;
          }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {costume.isAvailable && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#5f7447] shadow-sm backdrop-blur-sm">
            Sẵn sàng thuê
          </span>
        )}
      </div>
      <div className="p-3">
        {costume.categoryName && (
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#927b45]">
            {costume.categoryName}
          </p>
        )}
        <p className="line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-black transition group-hover:text-[#99854e]">
          {costume.name}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2 border-t border-[#eee9e0] pt-2">
          <div>
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#8b877f]">Giá thuê</p>
            <p className="mt-0.5 font-serif text-sm font-semibold text-[#7f7041]">
              {formatCurrency(costume.rentalPrice)}
            </p>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#9b8248] transition group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </div>
      </div>
    </button>
  );
}

export default function StylistProductCards({ costumes = [], onSelect }) {
  if (costumes.length === 0) {
    return null;
  }

  return (
    <div
      className="stylist-product-scrollbar mt-3 w-full snap-x snap-mandatory overflow-x-auto pb-3"
      aria-label="Danh sách sản phẩm được AI Stylist gợi ý"
    >
      <div className="flex w-max gap-3">
        {costumes.map((costume) => (
          <StylistProductCard
            key={costume.id}
            costume={costume}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
