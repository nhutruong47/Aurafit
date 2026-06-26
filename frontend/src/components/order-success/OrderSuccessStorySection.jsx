// Section khuyen khich chia se trai nghiem sau khi dat hang thanh cong.
export default function OrderSuccessStorySection({ links }) {
  return (
    <section className="bg-[#f7f7f7] px-5 py-28 text-center md:px-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-8 font-serif text-5xl font-normal">Kéo dài câu chuyện của bạn.</h2>
        <p className="mb-12 text-lg font-light leading-8 text-[#5f5e5e]">
          Ghi lại hành trình của bạn và gắn thẻ AuraFit. Những khoảnh khắc nổi bật có thể xuất hiện trong
          Yearbook theo mùa của chúng tôi.
        </p>
        <div className="flex justify-center gap-12">
          {links.map((link) => (
            <a
              key={link}
              className="border-b border-black pb-1 text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:border-[#99854e] hover:text-[#99854e]"
              href="#"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
