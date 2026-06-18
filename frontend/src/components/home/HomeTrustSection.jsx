// Khu vuc nhan manh cac diem tin cay va quy trinh cua AuraFit.
import { trustMarkers } from './homeData';

export default function HomeTrustSection() {
  return (
    <section className="border-y border-[#cfc4c5]/25 bg-[#f9f9f9] py-24">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-12 px-5 md:grid-cols-4 md:px-20">
        {trustMarkers.map((marker) => (
          <article key={marker.title} className="text-center">
            <span className="material-symbols-outlined mb-6 block text-[32px] text-[#99854e]">{marker.icon}</span>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">{marker.title}</h3>
            <p className="text-base italic leading-7 text-[#4c4546]">{marker.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
