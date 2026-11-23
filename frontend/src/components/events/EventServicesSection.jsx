// Cac dich vu ho tro khi thue trang phuc su kien.
export default function EventServicesSection({ services }) {
  return (
    <section className="border-y border-[#DED2C2]/60 bg-white py-10">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 md:grid-cols-3 md:px-20">
        {services.map(([icon, title, copy]) => (
          <article key={title} className="flex gap-4">
            <span className="material-symbols-outlined text-[30px] text-[#756536]">{icon}</span>
            <div>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B6259]">{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
