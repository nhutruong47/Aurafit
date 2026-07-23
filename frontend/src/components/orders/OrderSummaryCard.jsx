import { formatCurrency } from '../../utils/formatCurrency';

const fallbackImage = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80';

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function OrderSummaryCard({ details = [] }) {
  if (!details || details.length === 0) return null;

  return (
    <div className="border-t border-[#cfc4c5] pt-8">
      <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
        Sản phẩm đã thuê
      </h3>
      <div className="space-y-4">
        {details.map((item, index) => (
          <div
            key={`${item.skuCode}-${index}`}
            className="flex items-start justify-between border-b border-[#cfc4c5]/20 pb-4"
          >
            <div className="flex items-start gap-4">
              <div className="h-16 w-12 shrink-0 overflow-hidden bg-[#eeeeee]">
                <img
                  src={item.costumeImageUrl || item.imageUrls?.[0] || item.imageUrl || fallbackImage}
                  alt={item.costumeName}
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-black">
                  {item.costumeName}
                </p>
                <p className="mt-1 text-[10px] text-[#5f5e5e]">
                  {[item.skuCode, item.size ? `Size ${item.size}` : null, item.color]
                    .filter(Boolean)
                    .join(' | ')}
                </p>
                {item.rentalStartDate && item.rentalEndDate && (
                  <p className="mt-1.5 text-[13px] font-medium text-[#5f5e5e]">
                    Từ {formatDate(item.rentalStartDate)} - Đến {formatDate(item.rentalEndDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right pt-0.5">
              <p className="text-xs font-bold text-black">
                {formatCurrency(item.subtotal || item.rentalPrice || 0)}
              </p>
              <p className="mt-1.5 text-[10px] text-[#7f7041] font-medium" title={`Thời gian thuê: ${item.rentalDays || 0} ngày`}>
                {item.rentalDays
                  ? `Thời gian thuê: ${item.rentalDays} ngày`
                  : `Giá/ngày: ${formatCurrency(item.rentalPrice || 0)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
