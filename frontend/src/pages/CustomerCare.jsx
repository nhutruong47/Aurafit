import { useState } from 'react';

const faqSections = [
  {
    id: 'shipping',
    number: '01',
    title: 'Shipping & Returns',
    questions: [
      {
        question: 'What is the rental duration?',
        answer:
          'Our standard rental period is 4 days. We also support 8 and 12 day rentals for destination events, long shoots, and multi-day celebrations.',
      },
      {
        question: 'How do I return my item?',
        answer:
          'Place every piece back into the reusable VIBE garment bag, attach the prepaid return label, then drop it at the assigned carrier before noon on the return date.',
      },
    ],
  },
  {
    id: 'damages',
    number: '03',
    title: 'Damages & Insurance',
    questions: [
      {
        question: 'What does the insurance cover?',
        answer:
          'The standard protection fee covers minor spills, small snags, and replaceable trims. Major damage, theft, or missing pieces may require an additional replacement fee.',
      },
      {
        question: 'What if the item arrives with an issue?',
        answer:
          'Message our care team within 2 hours of delivery with photos. We will arrange a replacement, repair support, or a styling alternative depending on your event timing.',
      },
    ],
  },
];

const careChannels = [
  { icon: 'forum', label: 'Live chat', copy: 'Fast styling and order help during rental hours.' },
  { icon: 'local_shipping', label: 'Delivery support', copy: 'Track arrivals, pickups, returns, and date changes.' },
  { icon: 'straighten', label: 'Fit advice', copy: 'Measurement checks before you lock the final size.' },
];

export default function CustomerCare({ onNavigate }) {
  const [openQuestion, setOpenQuestion] = useState('shipping-0');

  const toggleQuestion = (sectionId, index) => {
    const key = `${sectionId}-${index}`;
    setOpenQuestion((current) => (current === key ? '' : key));
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto max-w-[1440px] px-5 py-20 text-center md:px-20 md:py-28">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Client Services</p>
        <h1 className="font-serif text-[42px] font-normal leading-[1.12] md:text-[72px]">
          How can we assist you?
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg font-light leading-8 text-[#5f5e5e]">
          Dedicated care for every rental moment, from fit checks and delivery timing to returns after the event.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {careChannels.map((channel) => (
            <article key={channel.label} className="border border-[#cfc4c5] bg-white p-7 text-left">
              <span className="material-symbols-outlined text-[34px] text-[#99854e]">{channel.icon}</span>
              <h2 className="mt-7 text-[12px] font-semibold uppercase tracking-[0.18em]">{channel.label}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">{channel.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-24 px-5 pb-24 md:px-20 md:pb-32">
        {faqSections.slice(0, 1).map((section) => (
          <FaqSection
            key={section.id}
            section={section}
            openQuestion={openQuestion}
            onToggle={toggleQuestion}
          />
        ))}

        <section id="size-guide" className="scroll-mt-28">
          <div className="mb-8 flex items-center gap-4">
            <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#99854e]">02</span>
            <h2 className="font-serif text-3xl font-normal md:text-4xl">Size Guide</h2>
          </div>

          <div className="border border-[#cfc4c5] bg-[#eeeeee] p-7 md:p-12">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <div>
                <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Find your perfect fit</p>
                <p className="mb-8 leading-7 text-[#5f5e5e]">
                  Designer sizing can shift across brands. Every VIBE listing includes garment measurements, fit notes,
                  and stylist comments so you can choose with confidence.
                </p>
                <button className="bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e]">
                  View conversion chart
                </button>
              </div>
              <div className="aspect-[4/5] overflow-hidden bg-[#f7f7f7]">
                <img
                  alt="Tailor measuring luxury fabric"
                  className="h-full w-full object-cover grayscale-[0.35] transition duration-700 hover:scale-105 hover:grayscale-0"
                  src="https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=900&q=85"
                />
              </div>
            </div>
          </div>
        </section>

        {faqSections.slice(1).map((section) => (
          <FaqSection
            key={section.id}
            section={section}
            openQuestion={openQuestion}
            onToggle={toggleQuestion}
          />
        ))}

        <section id="stylists" className="scroll-mt-28">
          <div className="grid grid-cols-1 overflow-hidden bg-black text-white md:grid-cols-2">
            <div className="min-h-[360px] overflow-hidden">
              <img
                alt="Stylist preparing a luxury rental wardrobe"
                className="h-full w-full object-cover opacity-90 transition duration-700 hover:scale-105"
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=85"
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-16">
              <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#99854e]">
                Personal Shopping
              </p>
              <h2 className="font-serif text-4xl font-normal leading-tight md:text-5xl">
                Expert guidance for your next event.
              </h2>
              <p className="mt-7 text-base font-light leading-8 text-white/75">
                Our stylists can help you choose the right silhouette, size, accessory set, and delivery timing before
                you confirm the rental.
              </p>
              <div className="mt-10">
                <button
                  onClick={() => onNavigate?.('chat')}
                  className="border border-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
                >
                  Book a styling consultation
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FaqSection({ section, openQuestion, onToggle }) {
  return (
    <section id={section.id} className="scroll-mt-28">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#99854e]">
          {section.number}
        </span>
        <h2 className="font-serif text-3xl font-normal md:text-4xl">{section.title}</h2>
      </div>

      <div className="border-t border-[#99854e]/30">
        {section.questions.map((item, index) => {
          const key = `${section.id}-${index}`;
          const isOpen = openQuestion === key;

          return (
            <article key={item.question} className="border-b border-[#cfc4c5]">
              <button
                onClick={() => onToggle(section.id, index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.17em] transition hover:text-[#99854e]">
                  {item.question}
                </span>
                <span
                  className={`material-symbols-outlined transition duration-300 ${isOpen ? 'rotate-45 text-[#99854e]' : ''}`}
                >
                  add
                </span>
              </button>
              <div
                className={`grid transition-all duration-500 ${isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-3xl leading-7 text-[#5f5e5e]">{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
