const policySections = [
  {
    number: '01',
    icon: 'calculate',
    title: 'Giá thuê và thời gian thuê',
    summary: 'Phí thuê được tính theo giá ngày, hệ số thời gian và số lượng sản phẩm.',
    items: [
      'Thuê 1–2 ngày áp dụng hệ số 1,0x.',
      'Từ ngày thứ 3, hệ số tăng thêm 0,2x cho mỗi ngày: 3 ngày = 1,2x; 4 ngày = 1,4x.',
      'Số ngày thuê được tính từ ngày nhận đến ngày trả đã chọn; ngày trả phải sau ngày nhận.',
      'Giá và tình trạng còn hàng được hệ thống kiểm tra lại khi tạo đơn.',
    ],
  },
  {
    number: '02',
    icon: 'sell',
    title: 'Chương trình ưu đãi',
    summary: 'Ưu đãi sự kiện giảm trực tiếp phần phí thuê, không làm thay đổi tiền cọc.',
    items: [
      'Sản phẩm thuộc chương trình đang hoạt động được áp dụng giá ưu đãi tại thời điểm checkout.',
      'Nếu một sản phẩm thuộc nhiều chương trình, hệ thống chọn mức giảm cao nhất.',
      'Giá trong giỏ hàng là ước tính; mức giảm được chốt và lưu vào đơn khi bạn xác nhận checkout.',
      'Ưu đãi hết hạn trước lúc tạo đơn sẽ không còn hiệu lực; ưu đãi đã chốt trong đơn không thay đổi khi thanh toán.',
    ],
  },
  {
    number: '03',
    icon: 'account_balance_wallet',
    title: 'Tiền đặt cọc hoàn trả',
    summary: 'Tiền cọc bảo vệ giá trị tài sản và được tách biệt với ưu đãi phí thuê.',
    items: [
      'Mức bảo đảm được tính bằng 120% giá trị sản phẩm; tiền cọc là phần còn lại sau khi trừ phí thuê gốc.',
      'Ưu đãi không làm tiền cọc tăng lên; mức cọc vẫn giữ theo công thức sử dụng phí thuê gốc.',
      'Tiền cọc được hoàn sau khi AuraFit nhận lại và kiểm tra sản phẩm.',
      'Phí trả trễ hoặc hư hỏng, nếu có, được khấu trừ từ tiền cọc; số tiền hoàn tối thiểu bằng 0đ.',
    ],
  },
  {
    number: '04',
    icon: 'local_shipping',
    title: 'Giữ lịch và giao nhận',
    summary: 'Mỗi sản phẩm có khoảng đệm vận hành để giặt ủi, kiểm tra và giao nhận an toàn.',
    items: [
      'Hệ thống giữ thêm 2 ngày trước ngày nhận và 2 ngày sau ngày trả để kiểm tra khả dụng.',
      'Khách hàng không bị tính phí thuê cho các ngày đệm.',
      'Bạn có thể nhận tại cửa hàng hoặc chọn giao nhận GHN nếu khu vực được hỗ trợ.',
      'Phí giao nhận được hiển thị riêng trong phần tóm tắt trước khi tạo đơn.',
    ],
  },
  {
    number: '05',
    icon: 'qr_code_2',
    title: 'Thanh toán và xác nhận',
    summary: 'Đơn chỉ được xác nhận sau khi hệ thống đối soát đủ số tiền.',
    items: [
      'Tổng thanh toán = phí thuê gốc + tiền cọc + phí giao nhận − ưu đãi.',
      'Thanh toán chuyển khoản bằng mã QR và đúng nội dung ARF của đơn.',
      'Đơn chờ thanh toán được giữ tối đa 15 phút; quá thời hạn, hệ thống tự hủy và trả tồn kho.',
      'Sau khi đối soát thành công, đơn chuyển sang trạng thái đã xác nhận.',
    ],
  },
  {
    number: '06',
    icon: 'assignment_return',
    title: 'Hủy đơn, trả trễ và hư hỏng',
    summary: 'Quyền hủy và mức hoàn tiền phụ thuộc vào trạng thái thực tế của đơn.',
    items: [
      'Khách hàng chỉ có thể hủy khi đơn đang chờ thanh toán hoặc đã xác nhận.',
      'Đơn đã thanh toán và đủ điều kiện hủy sẽ tạo yêu cầu hoàn tiền theo số tiền đã thanh toán.',
      'Phí trả trễ mặc định bằng 1,5 lần đơn giá thuê trung bình mỗi ngày trễ và không vượt quá tiền cọc.',
      'Hư hỏng hoặc thất lạc được nhân viên ghi nhận khi bàn giao; chi phí thực tế được khấu trừ vào tiền cọc.',
      'Tài khoản có 3 lần hủy liên tiếp có thể bị tạm khóa để hạn chế việc giữ hàng bất thường.',
    ],
  },
];

const formulaItems = [
  { label: 'Phí thuê gốc', value: 'Giá ngày × hệ số × số lượng' },
  { label: 'Ưu đãi', value: 'Phí gốc − phí sau giảm' },
  { label: 'Tổng thanh toán', value: 'Thuê gốc + cọc + giao nhận − ưu đãi' },
];

export default function PolicyPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#f6f2eb] text-[#2f251f]">
      <section className="relative overflow-hidden border-b border-[#cdbda9] bg-[#473a33] px-5 py-16 text-[#f8f0df] sm:px-8 lg:py-24">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-[#c9ae68]/30" />
        <div className="pointer-events-none absolute -bottom-40 right-20 h-96 w-96 rounded-full border border-[#c9ae68]/15" />

        <div className="relative mx-auto max-w-[1200px]">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#ead9aa]">
            Thuê trang phục minh bạch
          </p>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-serif text-4xl font-normal italic leading-tight sm:text-5xl lg:text-7xl">
                Chính sách thuê tại AuraFit
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#f4ecdc]/75 sm:text-base">
                Các nguyên tắc dưới đây phản ánh trực tiếp cách hệ thống tính giá, giữ lịch,
                thanh toán và hoàn cọc. Bạn luôn nhìn thấy đầy đủ chi phí trước khi xác nhận đơn.
              </p>
            </div>

            <div className="border border-[#ead9aa]/25 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ead9aa]">
                Nguyên tắc cốt lõi
              </p>
              <p className="mt-3 font-serif text-2xl italic">Ưu đãi giảm phí thuê, không chuyển thành tiền cọc.</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 lg:py-20">
        <section className="mb-16 grid border border-[#d8cabc] bg-[#fffdfa] md:grid-cols-3">
          {formulaItems.map((item, index) => (
            <div
              key={item.label}
              className={`p-6 sm:p-8 ${index < formulaItems.length - 1 ? 'border-b border-[#d8cabc] md:border-b-0 md:border-r' : ''}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7745]">
                {item.label}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#5f554d]">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="mb-10 flex flex-col gap-3 border-b border-[#cdbda9] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a7745]">
              Điều khoản áp dụng
            </p>
            <h2 className="mt-2 font-serif text-3xl italic sm:text-4xl">Mọi điều bạn cần biết trước khi thuê</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#74685f]">
            Chính sách có thể được cập nhật khi nghiệp vụ thay đổi; giá trị hiển thị trong đơn đã tạo là căn cứ thanh toán.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {policySections.map((section) => (
            <article
              key={section.number}
              className="group border border-[#d8cabc] bg-[#fffdfa] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#9a7745]/70 hover:shadow-lg sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3f7c78] text-white">
                    <span className="material-symbols-outlined text-[21px]">{section.icon}</span>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a7745]">
                      Điều {section.number}
                    </p>
                    <h3 className="mt-1 font-serif text-xl sm:text-2xl">{section.title}</h3>
                  </div>
                </div>
              </div>

              <p className="border-l-2 border-[#c9ae68] pl-4 text-sm leading-6 text-[#5f554d]">
                {section.summary}
              </p>

              <ul className="mt-6 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-[#74685f]">
                    <span className="material-symbols-outlined mt-0.5 text-[17px] text-[#3f7c78]">
                      check_circle
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-16 overflow-hidden bg-[#2f251f] text-[#f8f0df]">
          <div className="grid lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="p-8 sm:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ead9aa]">
                Cần hỗ trợ thêm?
              </p>
              <h2 className="mt-3 font-serif text-3xl italic">AuraFit sẵn sàng giải đáp trước khi bạn đặt thuê.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f4ecdc]/70">
                Hãy liên hệ đội ngũ tư vấn nếu bạn cần xác nhận lịch, kích thước, phương thức nhận hàng hoặc cách hoàn cọc.
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 p-8 sm:flex-row lg:border-l lg:border-t-0">
              <button
                type="button"
                onClick={() => onNavigate?.('catalog')}
                className="bg-[#ead9aa] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f251f] transition hover:bg-white"
              >
                Xem bộ sưu tập
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('care')}
                className="border border-white/30 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:border-white hover:bg-white/10"
              >
                Liên hệ AuraFit
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
