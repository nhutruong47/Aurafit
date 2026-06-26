import { formatCurrency } from '../../utils/formatCurrency';
import { SmallFact, StatusBadge } from './StaffDashboardShared';

export default function StaffOrderDetails({ activeOrder, selectedDetailId, onSelectDetail, onPreviewImage }) {
  if (!activeOrder) {
    return <div className="border border-[#cfc4c5] bg-white p-10 text-center text-[#5f5e5e]">Chưa có đơn thuê.</div>;
  }

  return (
    <>
      <section className="border border-[#cfc4c5] bg-white p-5 md:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#e1dddc] pb-5 md:flex-row md:items-start">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="font-serif text-3xl italic">RO-{String(activeOrder.id).padStart(4, '0')}</h2>
              <StatusBadge status={activeOrder.status} />
            </div>
            <p className="text-sm text-[#5f5e5e]">
              {activeOrder.customerName} | {activeOrder.customerEmail} | {activeOrder.customerPhone}
            </p>
          </div>
          <div className="text-sm md:text-right">
            <p>Phí thuê: <strong>{formatCurrency(activeOrder.totalRentalFee || 0)}</strong></p>
            <p>Cọc: <strong>{formatCurrency(activeOrder.totalDeposit || 0)}</strong></p>
          </div>
        </div>

        <div className="space-y-4">
          {activeOrder.details?.map((detail) => (
            <article
              key={detail.id}
              className={`grid gap-4 border p-4 md:grid-cols-[112px_1fr] ${
                String(selectedDetailId) === String(detail.id) ? 'border-[#99854e] bg-[#f8f4e8]' : 'border-[#e1dddc]'
              }`}
            >
              <button onClick={() => onSelectDetail(detail.id)} className="aspect-[3/4] overflow-hidden bg-[#eeeeee]">
                <img src={detail.costumeImageUrl} alt={detail.costumeName} className="h-full w-full object-cover" />
              </button>
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <button onClick={() => onSelectDetail(detail.id)} className="text-left font-serif text-2xl italic">
                    {detail.costumeName}
                  </button>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
                    {detail.skuCode} | Size {detail.size}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <SmallFact label="Item" value={detail.itemStatus} />
                  <SmallFact label="Trả đồ" value={detail.returnStatus || 'Chưa trả'} />
                  <SmallFact label="Phí thuê" value={formatCurrency(detail.rentalPrice || 0)} />
                  <SmallFact label="Tiền cọc" value={formatCurrency(detail.depositPrice || 0)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border border-[#cfc4c5] bg-white">
        <div className="border-b border-[#cfc4c5] px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Lịch sử ảnh và ghi chú</h2>
        </div>
        <div className="divide-y divide-[#e1dddc]">
          {activeOrder.handovers?.length ? (
            activeOrder.handovers.map((handover) => (
              <article key={handover.id} className="grid gap-4 p-5 md:grid-cols-[104px_1fr]">
                <button onClick={() => onPreviewImage(handover.handoverImageUrl)} className="aspect-square overflow-hidden bg-[#eeeeee]">
                  <img src={handover.handoverImageUrl} alt={handover.costumeName} className="h-full w-full object-cover" />
                </button>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="border border-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                      {handover.type}
                    </span>
                    {handover.returnStatus && <StatusBadge status={handover.returnStatus} />}
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#999999]">
                      {new Date(handover.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="font-medium">{handover.costumeName}</p>
                  <p className="mt-1 text-sm text-[#5f5e5e]">
                    {handover.skuCode} | Staff: {handover.staffName}
                  </p>
                  {handover.note && <p className="mt-3 text-sm leading-6">{handover.note}</p>}
                </div>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-[#5f5e5e]">Chưa có ảnh bàn giao hoặc ảnh trả đồ.</p>
          )}
        </div>
      </section>
    </>
  );
}
