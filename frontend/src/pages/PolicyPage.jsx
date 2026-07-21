import React from 'react';

export default function PolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f4f3] font-sans text-black">
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-8 font-serif text-3xl font-medium uppercase tracking-widest text-center">Chính sách thuê trang phục</h1>
          
          <div className="space-y-10 text-gray-800 leading-relaxed">
            
            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">1. Phí thuê và Đặt cọc</h2>
              <p>
                - <strong>Giá thuê:</strong> Giá hiển thị trên website là giá thuê tính cho <strong>1 ngày</strong> sử dụng. <br/>
                - <strong>Tính tổng phí thuê:</strong> Tổng phí thuê = (Giá thuê/ngày) × (Số lượng) × (Số ngày thuê).<br/>
                - <strong>Tiền cọc:</strong> Khách hàng cần đặt cọc một khoản tiền bằng giá trị bán lẻ của trang phục (hiển thị rõ tại bước thanh toán). Tiền cọc sẽ được hoàn trả lại sau khi AuraFit nhận lại trang phục đúng hạn và đạt chuẩn kiểm tra tình trạng.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">2. Chính sách Ngày đệm (Buffer Days)</h2>
              <p>
                Để đảm bảo trang phục được chuẩn bị tốt nhất và tránh các rủi ro chậm trễ, hệ thống sẽ tự động cộng thêm <strong>2 ngày đệm</strong> cho mỗi đơn hàng (không tính phí).
                Khoảng thời gian này giúp AuraFit có đủ thời gian giặt ủi, kiểm tra và vận chuyển trang phục trước ngày bạn nhận, cũng như xử lý sau khi bạn trả hàng.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-medium text-[#99854e]">3. Trả hàng trễ hạn</h2>
              <p>
                Trang phục cần được trả đúng ngày kết thúc thuê (rentalEndDate) đã chọn. Trong trường hợp trả trễ:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Phí trễ hạn = <strong>1.5 × (Giá thuê/ngày)</strong> cho mỗi ngày trễ.</li>
                <li>Phí trễ hạn sẽ được trừ trực tiếp vào tiền cọc của bạn.</li>
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
