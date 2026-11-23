// Accordion FAQ cho mot nhom cau hoi trong trang cham soc khach hang.
export default function CareFaqSection({ section, openQuestion, onToggle }) {
  return (
    <section id={section.id} className="scroll-mt-28">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#756536]">
          {section.number}
        </span>
        <h2 className="font-serif text-3xl font-normal md:text-4xl">{section.title}</h2>
      </div>

      <div className="border-t border-[#A98A55]/30">
        {section.questions.map((item, index) => {
          const key = `${section.id}-${index}`;
          const isOpen = openQuestion === key;

          return (
            <article key={item.question} className="border-b border-[#DED2C2]">
              <button
                onClick={() => onToggle(section.id, index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.17em] transition hover:text-[#756536]">
                  {item.question}
                </span>
                <span
                  className={`material-symbols-outlined transition duration-300 ${isOpen ? 'rotate-45 text-[#756536]' : ''}`}
                >
                  add
                </span>
              </button>
              <div className={`grid transition-all duration-500 ${isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="max-w-3xl leading-7 text-[#6B6259]">{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
