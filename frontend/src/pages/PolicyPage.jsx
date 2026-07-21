import React from 'react';

export default function PolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f4f3] font-sans text-black">
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-8 font-serif text-3xl font-medium uppercase tracking-widest text-center">Chính sách thuê trang phục</h1>
          
          <div className="space-y-10 text-gray-800 leading-relaxed">
            
            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">1. Chính sách giá thuê & Hệ số thời gian</h2>
              <p className="mb-2">Giá hiển thị trên website là <strong>Giá thuê gốc cơ bản</strong> dành cho các gói thuê ngắn hạn. Hệ thống áp dụng công thức tính giá theo <strong>Hệ số thuê (Rental Multiplier)</strong> như sau:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>Thuê ngắn hạn (1-2 ngày):</strong> Áp dụng giá gốc cơ bản (Hệ số chuẩn 1.0x).</li>
                <li><strong>Thuê dài hạn (Từ 3 ngày trở lên):</strong> Áp dụng hệ số nhân thời gian tăng dần tự động dựa trên số ngày thực tế (+0.2x cho mỗi ngày tăng thêm). <br/><span className="text-gray-500 italic text-sm">Ví dụ: Thuê 3 ngày hệ số là 1.2x, 4 ngày là 1.4x,...</span></li>
                <li><strong>Tổng phí thuê = </strong> Giá thuê gốc × Hệ số thuê × Số lượng.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">2. Tiền đặt cọc (Security Deposit)</h2>
              <p>
                Để đảm bảo rủi ro cho các sản phẩm thời trang cao cấp, khách hàng cần thanh toán một khoản <strong>Tiền đặt cọc</strong> được tính toán dựa trên giá trị tài sản của trang phục (hiển thị chi tiết tại bước thanh toán).
                Khoản cọc này sẽ được hoàn trả lại 100% sau khi AuraFit nhận lại trang phục đúng hạn và đạt chuẩn kiểm tra tình trạng (không rách, hỏng, phai màu,...).
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">3. Phí trễ hạn & Ngày đệm (Buffer Days)</h2>
              <p className="mb-2">
                Để đảm bảo trang phục được chuẩn bị tốt nhất, hệ thống có thiết kế sẵn các khoảng <strong>Ngày đệm (Buffer Days)</strong> ngầm định cho việc xử lý giặt ủi và vận chuyển (bạn không bị tính phí cho những ngày này). Tuy nhiên, trang phục phải được trả lại đúng <strong>Ngày trả (Rental End Date)</strong> mà bạn đã chọn:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>Cơ chế phí phát sinh:</strong> Phí trễ hạn = <strong>1.5 × Giá gốc</strong> cho mỗi ngày trả trễ.</li>
                <li>Phí trễ hạn sẽ được trừ trực tiếp vào tiền cọc đã thanh toán.</li>
                <li>Nếu phí trễ hạn vượt quá tổng số tiền cọc, toàn bộ tiền cọc sẽ bị khấu trừ.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">4. Hư hỏng và Đền bù</h2>
              <p>
                Khi nhận lại hàng, nhân viên của chúng tôi sẽ tiến hành kiểm tra (Inspection).
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Hư hỏng nhẹ:</strong> Vết bẩn có thể giặt tẩy được, sứt chỉ nhỏ – <em>Không tính phí</em>.</li>
                <li><strong>Hư hỏng nặng:</strong> Rách, cháy, phai màu nặng, hoặc mất phụ kiện đi kèm – <em>Tính phí đền bù tùy theo mức độ thiệt hại</em>, trừ vào tiền cọc.</li>
                <li><strong>Mất hoàn toàn:</strong> Nếu làm mất trang phục, bạn sẽ bị mất 100% tiền cọc (tương đương giá trị mua mới của trang phục).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">5. Hủy đơn hàng</h2>
              <p>
                Bạn có thể hủy đơn hàng trước khi đơn hàng chuyển sang trạng thái "Đang giao". 
                Toàn bộ tiền cọc và tiền thuê sẽ được hoàn lại (thời gian xử lý hoàn tiền phụ thuộc vào ngân hàng của bạn). 
                Khi đơn hàng đã giao cho đơn vị vận chuyển, bạn không thể hủy đơn.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
