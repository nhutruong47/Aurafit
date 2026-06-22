import { formatCurrency } from '../../utils/formatCurrency';
import { getOrderCode, getOrderTimeline, mapOrderStatus } from './orderUtils';
import OrderTimeline from './OrderTimeline';

const fallbackImage =
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80';

export default function OrderDetailsPanel({ order }) {
  const statusInfo = mapOrderStatus(order.status);
  const timeline = getOrderTimeline(order);

  return (
    <div className="sticky top-28 border border-[#cfc4c5] bg-white p-8 md:p-10">
      <div className="mb-8 flex items-baseline justify-between border-b border-[#cfc4c5] pb-6">
        <h2 className="font-serif text-3xl font-normal">Chi tiet: {getOrderCode(order.id)}</h2>
        <span className={`text-[12px] font-bold uppercase tracking-[0.2em] ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>

      <div className="mb-12">
        <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
          Tien trinh don hang
        </h3>
        <OrderTimeline timeline={timeline} />
      </div>

      <div className="border-t border-[#cfc4c5] pt-8">
        <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
          San pham da thue
        </h3>
        <div className="space-y-4">
          {order.details?.map((item, index) => (
            <div
              key={`${item.skuCode}-${index}`}
              className="flex items-center justify-between border-b border-[#cfc4c5]/20 pb-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-12 overflow-hidden bg-[#eeeeee]">
                  <img
                    src={item.costumeImageUrl || fallbackImage}
                    alt={item.costumeName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-black">
                    {item.costumeName}
                  </p>
                  <p className="mt-1 text-[10px] text-[#5f5e5e]">
                    {[item.skuCode, item.size ? `Size ${item.size}` : null, item.color]
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-black">
                  {formatCurrency(item.subtotal || item.rentalPrice || 0)}
                </p>
                <p className="mt-0.5 text-[9px] text-[#999999]">
                  {item.rentalDays
                    ? `${item.rentalDays} ngay thue`
                    : `Gia/ngay: ${formatCurrency(item.rentalPrice || 0)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
