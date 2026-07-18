import { fallbackCostumeImage, getCostumeImage } from '../../utils/costumeUtils';
import { formatCurrency } from '../../utils/formatCurrency';

function StylistProductCard({ costume, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(costume)}
      className="group w-36 shrink-0 overflow-hidden border border-[#d8d0c3] bg-white text-left transition hover:border-[#99854e] sm:w-40"
      aria-label={`Xem chi tiết ${costume.name}`}
    >
      <div className="h-28 overflow-hidden bg-[#eeeeee] sm:h-32">
        <img
          src={getCostumeImage(costume)}
          alt={costume.name}
          onError={(event) => {
            event.currentTarget.src = fallbackCostumeImage;
          }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-black transition group-hover:text-[#99854e]">
          {costume.name}
        </p>
        <p className="mt-2 font-serif text-sm text-[#7f7041]">
          {formatCurrency(costume.rentalPrice)}
        </p>
      </div>
    </button>
  );
}

export default function StylistProductCards({ costumes = [], onSelect }) {
  if (costumes.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 w-full overflow-x-auto pb-2">
      <div className="flex w-max gap-2">
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
