// Cac buoc huong dan quy trinh thue do cosplay.
export default function CosplayStepsSection({ steps }) {
  return (
    <section className="border-t border-[#cfc4c5] bg-white py-18 md:py-24">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 md:grid-cols-4 md:px-20">
        {steps.map(([step, title, copy]) => (
          <article key={step} className="border border-[#cfc4c5] p-6">
            <p className="font-serif text-3xl italic text-[#99854e]">{step}</p>
            <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
