// Khu vuc gioi thieu cac dich vu va loi ich chinh.
import { services } from './homeData';

export default function HomeServicesSection() {
  return (
    <section className="bg-[#f9f9f9] py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">
            Dịch vụ của chúng tôi
          </p>
          <h2 className="font-serif text-4xl font-normal md:text-5xl">Trải nghiệm thuê đồ liền mạch</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="border border-[#cfc4c5]/30 bg-white p-10 text-center transition duration-500 hover:border-[#99854e]/40 md:p-12"
            >
              <span className="material-symbols-outlined mb-8 block text-[40px] text-[#99854e]">
                {service.icon}
              </span>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">{service.title}</h3>
              <p className="text-base italic leading-7 text-[#4c4546]">{service.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
