// Sidebar tom tat giao hang va thanh toan cua trang order success.
function InfoRow({ icon, title, value, muted = false }) {
  return (
    <div className="flex gap-4">
      <span className="material-symbols-outlined text-[#99854e]">{icon}</span>
      <div>
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.15em]">{title}</p>
        <p className={muted ? 'leading-6 text-[#5f5e5e]' : 'leading-6'}>{value}</p>
      </div>
    </div>
  );
}

function SmallSummary({ label, value }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function OrderSuccessSidebar() {
  return (
    <aside className="md:col-span-5">
      <div className="sticky top-32 space-y-12">
        <div className="border border-[#cfc4c5] bg-white p-10">
          <h2 className="mb-8 border-b border-[#cfc4c5] pb-4 text-[12px] font-semibold uppercase tracking-[0.2em]">
            Concierge Delivery
          </h2>
          <div className="space-y-8">
            <InfoRow icon="parking_valet" title="Service Type" value="White Glove Concierge" />
            <InfoRow
              icon="location_on"
              title="Destination"
              value={
                <>
                  The Ritz-Carlton, Suite 402
                  <br />
                  Avenue Montaigne, Paris
                </>
              }
            />
            <InfoRow
              icon="info"
              title="Instructions"
              value="Our courier will arrive between 9:00 AM and 11:00 AM. Please ensure someone is available to sign for the garments. Hangers and protective covers are included and must be returned."
              muted
            />
          </div>
          <button className="mt-12 w-full bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]">
            Contact Concierge
          </button>
        </div>

        <div className="px-10">
          <SmallSummary label="Subtotal" value="€1,450.00" />
          <SmallSummary label="Concierge Fee" value="Included" />
          <div className="mt-4 flex items-center justify-between border-t border-[#cfc4c5] pt-4">
            <span className="text-[12px] font-bold uppercase tracking-[0.15em]">Total Paid</span>
            <span className="font-serif text-3xl">€1,450.00</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
