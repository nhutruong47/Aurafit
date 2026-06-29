import { useState } from 'react';
import CareFaqSection from '../components/care/CareFaqSection';

const faqSections = [
  {
    id: 'shipping',
    number: '01',
    title: 'Giao nhận & hoàn trả',
    questions: [
      {
        question: 'Thời gian thuê tiêu chuẩn là bao lâu?',
        answer:
          'Thời gian thuê tiêu chuẩn là 4 ngày. AuraFit cũng hỗ trợ gói thuê 8 và 12 ngày cho sự kiện xa, buổi chụp kéo dài hoặc lịch trình nhiều ngày.',
      },
      {
        question: 'Tôi hoàn trả sản phẩm như thế nào?',
        answer:
          'Hãy đặt toàn bộ sản phẩm trở lại túi trang phục tái sử dụng của VIBE, dán nhãn hoàn trả đã thanh toán trước và gửi tại đơn vị vận chuyển được chỉ định trước 12 giờ trưa vào ngày trả.',
      },
    ],
  },
  {
    id: 'damages',
    number: '03',
    title: 'Hư hỏng & bảo hiểm',
    questions: [
      {
        question: 'Bảo hiểm bao gồm những gì?',
        answer:
          'Phí bảo vệ tiêu chuẩn bao gồm các vết bẩn nhẹ, vết xước nhỏ và phụ kiện có thể thay thế. Hư hỏng lớn, mất cắp hoặc thất lạc chi tiết có thể phát sinh thêm phí bồi hoàn.',
      },
      {
        question: 'Nếu sản phẩm giao đến gặp vấn đề thì sao?',
        answer:
          'Hãy nhắn cho đội ngũ chăm sóc trong vòng 2 giờ sau khi nhận hàng kèm hình ảnh. Chúng tôi sẽ hỗ trợ đổi sản phẩm, xử lý chỉnh sửa hoặc đề xuất lựa chọn khác tùy thời gian sự kiện của bạn.',
      },
    ],
  },
];

const careChannels = [
  { icon: 'smart_toy', label: 'Chatbot tự động', copy: 'Tư vấn phong cách và đơn thuê nhanh chóng bằng chatbot AuraFit.' },
  { icon: 'local_shipping', label: 'Hỗ trợ giao nhận', copy: 'Theo dõi giao hàng, nhận hàng, hoàn trả và thay đổi lịch thuê.' },
  { icon: 'straighten', label: 'Tư vấn form dáng', copy: 'Kiểm tra số đo trước khi bạn chốt size cuối cùng.' },
];

export default function CustomerCarePage({ onNavigate }) {
  const [openQuestion, setOpenQuestion] = useState('shipping-0');

  const toggleQuestion = (sectionId, index) => {
    const key = `${sectionId}-${index}`;
    setOpenQuestion((current) => (current === key ? '' : key));
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c]">
      <section className="mx-auto max-w-[1440px] px-5 py-20 text-center md:px-20 md:py-28">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Hỗ trợ khách hàng</p>
        <h1 className="font-serif text-[42px] font-normal leading-[1.12] md:text-[72px]">
          AuraFit có thể hỗ trợ bạn điều gì?
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg font-light leading-8 text-[#5f5e5e]">
          Đồng hành cùng bạn trong mọi giai đoạn thuê đồ, từ kiểm tra form dáng và lịch giao nhận đến hoàn trả
          sau sự kiện.
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
          <CareFaqSection
            key={section.id}
            section={section}
            openQuestion={openQuestion}
            onToggle={toggleQuestion}
          />
        ))}

        <section id="size-guide" className="scroll-mt-28">
          <div className="mb-8 flex items-center gap-4">
            <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#99854e]">02</span>
            <h2 className="font-serif text-3xl font-normal md:text-4xl">Bảng size</h2>
          </div>

          <div className="border border-[#cfc4c5] bg-[#eeeeee] p-7 md:p-12">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <div>
                <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Tìm form dáng phù hợp</p>
                <p className="mb-8 leading-7 text-[#5f5e5e]">
                  Size của từng thương hiệu có thể khác nhau. Mỗi sản phẩm trên AuraFit đều có số đo, ghi chú form
                  dáng và nhận xét từ stylist để bạn chọn tự tin hơn.
                </p>
                <button className="bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e]">
                  Xem bảng quy đổi size
                </button>
              </div>
              <div className="aspect-[4/5] overflow-hidden bg-[#f7f7f7]">
                <img
                  alt="Thợ may đang đo vải"
                  className="h-full w-full object-cover grayscale-[0.35] transition duration-700 hover:scale-105 hover:grayscale-0"
                  src="https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=900&q=85"
                />
              </div>
            </div>
          </div>
        </section>

        {faqSections.slice(1).map((section) => (
          <CareFaqSection
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
                alt="Stylist đang chuẩn bị tủ đồ thuê cao cấp"
                className="h-full w-full object-cover opacity-90 transition duration-700 hover:scale-105"
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=85"
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-16">
              <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#99854e]">
                Tư vấn cá nhân
              </p>
              <h2 className="font-serif text-4xl font-normal leading-tight md:text-5xl">
                Đồng hành cùng bạn cho sự kiện sắp tới.
              </h2>
              <p className="mt-7 text-base font-light leading-8 text-white/75">
                Stylist của AuraFit có thể hỗ trợ bạn chọn dáng, size, bộ phụ kiện và thời gian giao nhận phù hợp
                trước khi chốt đơn thuê.
              </p>
              <div className="mt-10">
                <button
                  onClick={() => onNavigate?.('chat')}
                  className="border border-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
                >
                  Đặt lịch tư vấn phong cách
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
