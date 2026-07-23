import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderItemPromotion({ detail, className = '' }) {
  const originalRentalFee = Number(detail?.subtotal || 0);
  const rentalFee = Number(detail?.rentalFee ?? originalRentalFee);
  const discountAmount = Number(detail?.discountAmount || 0);
  const discountPercent = Number(detail?.discountPercent || 0);
  const hasDiscount = discountAmount > 0;

  return (
    <div className={`space-y-1.5 text-xs ${className}`}>
      <p className="text-[#5f5e5e]">
        Giá thuê:{' '}
        {hasDiscount && (
          <span className="mr-1.5 line-through">{formatCurrency(originalRentalFee)}</span>
        )}
        <span className={`font-semibold ${hasDiscount ? 'text-emerald-700' : 'text-gray-900'}`}>
          {formatCurrency(rentalFee)}
        </span>
      </p>

      {hasDiscount && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            <span className="material-symbols-outlined text-[14px]">local_offer</span>
            {detail.discountEventName || 'Ưu đãi đã áp dụng'}
          </span>
          <span className="font-semibold text-emerald-700">
            -{formatCurrency(discountAmount)}
            {discountPercent > 0 ? ` (${discountPercent}%)` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
