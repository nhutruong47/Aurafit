# User Flow - Dự án AuraFit

Tài liệu này mô tả luồng thao tác của người dùng (User Flow) dựa trên các tính năng đã được thực hiện (Phase 1, Phase 2 và Phase 3 - Part 1).

## 1. Khách vãng lai (Guest) - Duyệt danh mục sản phẩm
* **Truy cập trang chủ/Danh mục:** Người dùng truy cập hệ thống và ngay lập tức có thể xem danh sách các danh mục (Categories) mà không cần đăng nhập.
  * *Hệ thống tự động gọi API:* `GET /api/public/catalog/categories`
* **Xem danh sách trang phục:** Người dùng chọn một danh mục, hoặc tìm kiếm trang phục bằng từ khóa. Hệ thống trả về danh sách sản phẩm phân trang (mỗi trang mặc định 12 sản phẩm).
  * *Hệ thống tự động gọi API:* `GET /api/public/catalog/costumes?categoryId={id}&keyword={kw}&pageNo=0&pageSize=12`
* **Xem chi tiết trang phục:** Người dùng bấm vào một bộ trang phục cụ thể để xem chi tiết mô tả, giá thuê trên ngày và các tùy chọn (size, màu sắc).
  * *Hệ thống tự động gọi API:* `GET /api/public/catalog/costumes/{id}`

## 2. Xác thực người dùng (Authentication)
Để thực hiện thao tác Thêm vào Giỏ hàng, hệ thống yêu cầu người dùng phải có tài khoản hợp lệ.
* **Đăng ký (Register):** Người dùng chưa có tài khoản điền form thông tin (email, mật khẩu, họ tên, số điện thoại). Quy trình xác thực email qua Gmail OTP được thực hiện ngay tại bước đăng ký — mọi tài khoản sau khi đăng ký thành công mặc định đã được xác thực email (`email_verified = true`).
  * *Quy trình nội bộ của Server:*
    - Tiếp nhận thông tin form đăng ký (`email`, `password`, `full_name`, `phone`).
    - Kiểm tra email đã tồn tại trong hệ thống hay chưa (trùng lặp → báo lỗi).
    - Sinh mã OTP 6 chữ số ngẫu nhiên, lưu vào `ConcurrentHashMap` (cache in-memory) với TTL 5 phút, key là `email`.
    - Gửi mã OTP qua email thông qua `JavaMailSender` (Gmail SMTP với App Password).
    - Sau khi khách hàng nhập đúng mã OTP → Mã OTP được verify trực tiếp từ cache (không lưu DB), xóa entry khỏi cache, tạo tài khoản chính thức và lưu vào Database với `email_verified = true`.
    - Nếu khách hàng nhập sai OTP hoặc OTP hết hạn (quá 5 phút) → báo lỗi, khách phải yêu cầu gửi lại mã.
  * *Dự phóng API:*
    - `POST /api/auth/register/request-otp` — Yêu cầu gửi mã OTP đến email đăng ký.
    - `POST /api/auth/register/verify-otp` — Xác thực mã OTP và hoàn tất đăng ký tài khoản.
* **Đăng nhập (Login):** Người dùng nhập email và mật khẩu. Hệ thống xác thực và trả về JWT `accessToken` (để gửi kèm trong các request bảo mật) và lưu `refreshToken` vào HttpOnly Cookie (để tự động cấp lại token mới).
  * *Người dùng gọi API:* `POST /api/users/login` (hoặc `/api/auth/login`)
* **Yêu cầu bảo mật:** Từ bước này trở đi, mọi request cá nhân (ví dụ: Giỏ hàng) đều phải đính kèm header `Authorization: Bearer <accessToken>`.

## 3. Quản lý Giỏ hàng (Shopping Cart)
Khi đã có tài khoản và Token, người dùng bắt đầu tiến trình chọn đồ để thuê.
* **Thêm vào Giỏ hàng (Add to Cart):** Từ trang chi tiết sản phẩm, người dùng chọn mã sản phẩm vật lý cụ thể (VD: Size M, Màu Đen, SKU: AF-002-M-1), chọn ngày bắt đầu thuê (`rentalStartDate`) và ngày trả (`rentalEndDate`).
  * *Quy trình nội bộ của Server:* 
    - Xác minh danh tính người dùng ngầm qua JWT (chặn IDOR).
    - Tạo giỏ hàng trống `ACTIVE` nếu người dùng chưa có.
    - Kiểm tra logic kinh doanh: Ngày trả đồ phải sau ngày mượn đồ.
    - Kiểm tra trạng thái tồn kho: Sản phẩm vật lý đó phải đang ở trạng thái `AVAILABLE`.
    - Chặn trùng lặp: Nếu món đồ (SKU) đó đã có trong giỏ hàng thì báo lỗi.
    - Tính toán giá tiền: Tự động đếm số ngày thuê x Giá thuê ngày = Subtotal.
  * *Người dùng gọi API:* `POST /api/cart/add`
* **Xem Giỏ hàng (View Cart):** Người dùng mở trang Giỏ hàng. Hệ thống hiển thị toàn bộ danh sách các mặt hàng đang chọn, thông tin chi tiết từng món đồ (tên, hình ảnh, size, ngày thuê) và **tổng tiền thanh toán** (`totalCartValue`).
  * *Hệ thống tự động gọi API:* `GET /api/cart`
* **Xóa khỏi Giỏ hàng (Remove Item):** Nếu đổi ý, người dùng bấm nút xóa (X) một món đồ khỏi giỏ hàng. Hệ thống tự động xóa món đồ đó và cập nhật lại tổng tiền.
  * *Người dùng gọi API:* `DELETE /api/cart/remove/{cartItemId}`

---

## 4. Tiến trình Đặt hàng (Checkout)
Khi đã hoàn tất việc chọn trang phục trong giỏ hàng, khách hàng tiến hành bước tiếp theo — xác minh thông tin cá nhân, giao hàng và tạo đơn thuê chính thức trong hệ thống. **Lưu ý:** Tài khoản sau khi đăng ký đã mặc định được xác thực email (`email_verified = true`), nên bước Checkout diễn ra liền mạch mà không có xác thực OTP cản trở.
* **Nhập thông tin giao hàng:** Khách hàng điền form thông tin người nhận bao gồm: `receiver_name` (Họ tên người nhận), `receiver_phone` (SĐT liên hệ), `delivery_address` (Địa chỉ nhận hàng chi tiết: số nhà, đường, phường/xã, quận/huyện, thành phố).
  * *Quy trình nội bộ của Server:*
    - Validate các trường bắt buộc (`receiver_name`, `receiver_phone`, `delivery_address`).
    - Kiểm tra định dạng SĐT Việt Nam (10 số, bắt đầu bằng 0).
    - Dữ liệu giao hàng sẽ được ghi nhận trực tiếp vào bản ghi `RentalOrder` khi tạo đơn ở bước tiếp theo (bảng `RentalOrder` có sẵn các cột `receiver_name`, `receiver_phone`, `delivery_address`).
  * *Người dùng gọi API:* `POST /api/orders/checkout` (gửi kèm thông tin giao hàng trong request body)
* **Xác nhận đơn hàng (Create Order):** Khách hàng xem lại toàn bộ thông tin: Danh sách trang phục đã chọn, `rental_start_date`, `rental_end_date`, phí thuê, tiền cọc, mã giảm giá (nếu có) và tổng số tiền. Khách hàng bấm nút "Xác nhận đặt hàng".
  * *Quy trình nội bộ của Server (bọc trong `@Transactional`):*
    - Xác minh danh tính qua JWT.
    - Truy xuất `Cart` có `status = 'ACTIVE'` và các `CartItem` liên kết của người dùng hiện tại.
    - Kiểm tra tồn kho: Tất cả `CostumeItem` liên kết phải có `status = 'AVAILABLE'`. Nếu bất kỳ SKU nào đang được thuê bởi đơn khác (`RENTED`) → báo lỗi, không cho đặt chồng.
    - Tính toán chi tiết bằng `BigDecimal`:
      - **total_rental_price:** Tổng (Số ngày thuê × `price_per_day` của từng `CostumeItem`) cho tất cả `RentalOrderDetail`.
      - **total_deposit:** Tổng `deposit_amount` của từng `CostumeItem` đã chọn.
      - **discount_amount:** Áp dụng mã khuyến mãi (nếu có), trừ vào tiền thuê.
    - Tạo bản ghi `RentalOrder` với `status = 'PENDING'` (chờ thanh toán).
    - Tạo các bản ghi `RentalOrderDetail` cho từng `CostumeItem`, mỗi bản ghi có `return_status = 'NOT_RETURNED'`.
    - Cập nhật `Cart.status = 'CHECKED_OUT'`.
    - Cập nhật `CostumeItem.status = 'RENTED'` cho các SKU đã đặt (khóa tồn kho, không cho thuê chồng).
  * *Người dùng gọi API:* `POST /api/orders/checkout`

## 5. Thanh toán (Payment)
Sau khi đơn hàng được tạo thành công (`RentalOrder.status = 'PENDING'`), khách hàng tiến hành thanh toán tự động qua hệ thống VietQR kết hợp đối soát tự động SePay.
* **Chọn phương thức thanh toán:** Khách hàng chọn phương thức Chuyển khoản ngân hàng qua mã QR (`BANKING`).
  * *Hệ thống tự động gọi API:* `GET /api/payment/methods` (Trả về cấu hình hiển thị BANKING).
* **Khởi tạo thanh toán & Quét mã VietQR (Init Payment):** Hệ thống sinh mã thanh toán VietQR động để hiển thị cho khách hàng.
  * *Quy trình nội bộ của Server:*
    - Tạo bản ghi `Payment` liên kết `rental_order_id`, lưu `amount`, `payment_type = 'RENTAL_FEE'`, `method = 'BANKING'`, `status = 'PENDING'`.
    - Sinh nội dung chuyển khoản chuẩn hóa duy nhất (Ví dụ: `ARF` + `orderId` -> `ARF123`) làm mã nhận diện giao dịch.
    - Tạo link ảnh QR động theo chuẩn VietQR thông qua API VietQR Public (`https://img.vietqr.io/image/BIDV-8824354356-compact2.jpg?amount={amount}&addInfo={content}&accountName=BUI%20LE%20HUY%20HOANG`).
  * *Người dùng gọi API:* `POST /api/payment/create` (body: `{ orderId, method: 'BANKING', paymentType: 'RENTAL_FEE' }`) -> Nhận về `qrImageUrl`, `paymentContent`, `amount`.
* **Xác nhận thanh toán tự động qua Webhook SePay (Payment Callback):**
  * *Quy trình nội bộ của Server:*
    - Hệ thống SePay tự động quét biến động số dư từ tài khoản ngân hàng BIDV của chủ shop. Khi phát hiện tiền vào với nội dung khớp mã giao dịch, SePay gửi một HTTP POST Request (Webhook) đến Backend AuraFit.
    - Server tiếp nhận Webhook tại Endpoint công khai, thực hiện validate API Key/Token của SePay trong header để đảm bảo an toàn.
    - Bóc tách nội dung chuyển khoản để tìm mã đơn hàng (`orderId`), kiểm tra số tiền nhận được (`amount`) có khớp với số tiền cần thanh toán trong bản ghi `Payment` hay không.
    - cập nhật Payment.status = 'PAID', ghi nhận mã đối soát vào trường transaction_id. Thời gian thanh toán thực tế sẽ được tracking dựa trên trường cập nhật audit dữ liệu updatedAt kế thừa từ BaseEntity
    - Chuyển trạng thái `RentalOrder.status = 'CONFIRMED'` (Hệ thống tự động xác nhận đơn vì đã khớp đối soát tiền thực tế, Staff sẵn sàng chuẩn bị hàng).
  * *Hệ thống tự động tiếp nhận:* `POST /api/public/payment/sepay-webhook` (Endpoint không chặn auth, cấu hình trực tiếp trên Gateway SePay).
  
## 6. Hệ thống AI Engine — Ghi nhận Hành vi Người dùng (AI Behavior Tracking)
Hệ thống AuraFit tích hợp AI Engine để tự động học hỏi sở thích từng người dùng thông qua việc theo dõi và phân tích hành vi tương tác trên nền tảng.
* **Ghi nhận sự kiện hành vi (Track User Behavior):** Mỗi khi người dùng thực hiện một hành động quan trọng (dù là Khách vãng lai hay Khách hàng đã đăng nhập), hành động đó được ghi nhận vào bảng `UserBehavior`.
  * *Các loại sự kiện được ghi nhận (theo `UserBehavior.action_type`):*
    - `VIEW`: Người dùng xem chi tiết một trang phục (`Costume`).
    - `CLICK`: Người dùng bấm vào một sản phẩm (ví dụ: từ trang danh mục).
    - `FAVORITE`: Người dùng đánh dấu yêu thích một trang phục.
    - `ADD_TO_CART`: Người dùng thêm sản phẩm vào giỏ hàng.
    - `RENT`: Người dùng hoàn tất đặt thuê (Checkout thành công).
    - `CHAT_INTEREST`: Người dùng nhắn tin hỏi về sản phẩm qua AI Chat.
  * *Quy trình nội bộ của Server:*
    - Frontend gửi sự kiện kèm `user_id` (hoặc `session_id` nếu là Guest), `action_type`, `costume_id`, `score`, `created_at`.
    - Backend ghi nhận vào bảng `UserBehavior` trong Database.
    - **AI Engine xử lý phân tích:**
      - Tổng hợp số lượng mỗi loại hành vi theo từng `Category`.
      - Tính toán trọng số: `RENT` có trọng số cao nhất, `ADD_TO_CART` cao hơn `VIEW`.
      - Cập nhật bảng `UserPreference`: Tăng `preference_score` của `Category` mà người dùng quan tâm nhiều nhất.
      - (Định kỳ) Retrain mô hình recommendation dựa trên dữ liệu tổng hợp.
  * *Frontend gọi API:* `POST /api/ai/track` (body: `{ userId?, sessionId, costumeId, actionType, score }`)

## 7. Gợi ý Sản phẩm từ AI (AI-Powered Recommendations)
Dựa trên dữ liệu hành vi đã thu thập, hệ thống AI Engine cá nhân hóa trải nghiệm cho từng người dùng bằng cách đề xuất trang phục phù hợp nhất.
* **Hiển thị gợi ý trên trang chủ (Homepage Recommendations):** Khi Khách hàng đã đăng nhập hoặc Khách vãng lai truy cập trang chủ, hệ thống tự động hiển thị danh sách sản phẩm được gợi ý.
  * *Quy trình nội bộ của Server:*
    - **Với Khách hàng (đã đăng nhập):**
      - Truy xuất `UserPreference` của người dùng, join với bảng `Category` qua `category_id` để lấy danh sách `category_id` ưu tiên (dựa vào `preference_score` giảm dần).
      - Kết hợp với `SeasonalTrend` (Xu hướng theo mùa): Join bảng `SeasonalTrend` với `Category` qua `category_id`, lọc theo `start_date`/`end_date` phù hợp ngày hiện tại, ưu tiên theo `priority_score`.
      - Query bảng `Costume` thuộc các `category_id` ưu tiên, có `status = 'ACTIVE'`, join `CostumeItem` với `status = 'AVAILABLE'`, sắp xếp theo điểm recommendation score (kết hợp `preference_score` và `priority_score`).
    - **Với Khách vãng lai (Guest):**
      - Sử dụng `sessionId` để truy xuất `UserPreference` tạm thời (nếu có lịch sử hành vi trong session qua `UserBehavior`).
      - Nếu không có dữ liệu, fallback sang `SeasonalTrend` và `PopularProducts` (sản phẩm phổ biến toàn hệ thống — thống kê từ `UserBehavior.action_type = 'RENT'`).
    - Trả về danh sách tối đa 8–12 sản phẩm gợi ý.
  * *Hệ thống tự động gọi API:* `GET /api/ai/recommendations?sessionId={sessionId}` (API được gọi ngầm khi load trang chủ)
* **Gợi ý theo ngữ cảnh trang (Contextual Recommendations):** Ngoài trang chủ, hệ thống hiển thị gợi ý tại các vị trí khác:
  * **Trang chi tiết sản phẩm:** "Bạn có thể thích" — sản phẩm cùng danh mục hoặc được ghép với sản phẩm đang xem.
  * **Trang Giỏ hàng:** "Thêm vào bộ sưu tập" — gợi ý trang phục bổ sung để hoàn thiện bộ đồ thuê.
  * *Hệ thống tự động gọi API:* `GET /api/ai/recommendations/similar/{costumeId}` hoặc `GET /api/ai/recommendations/complementary`

## 8. Chat với AI (AI Assistant)
Hệ thống tích hợp AI Chat Assistant hỗ trợ Khách hàng và Khách vãng lai trả lời các câu hỏi về trang phục, chính sách thuê và các vấn đề liên quan.
* **Khởi tạo phiên chat (Start Chat Session):** Người dùng mở cửa sổ chat, hệ thống tự động tạo một phiên làm việc mới.
  * *Quy trình nội bộ của Server:*
    - Tạo bản ghi `AiChatSession` với `user_id` (hoặc null nếu Guest), `status = 'ACTIVE'`, `created_at`, `updated_at`.
    - Trả về `sessionId` để sử dụng cho các tin nhắn tiếp theo trong phiên.
  * *Hệ thống tự động gọi API:* `POST /api/ai/chat/sessions`
* **Gửi tin nhắn chat (Send Message):** Người dùng nhập nội dung câu hỏi và gửi đi.
  * *Quy trình nội bộ của Server:*
    - Lưu tin nhắn người dùng vào bảng `AiChatMessage` với `sender = 'USER'`, `session_id`, `created_at`.
    - **AI Engine xử lý:**
      - Phân tích ý định (Intent Detection): hỏi giá, hỏi size, hỏi tồn kho, hỏi chính sách đổi trả...
      - Ghi nhận `detected_intent` và `detected_category_id` (nếu câu hỏi liên quan đến danh mục) vào `AiChatMessage`.
      - Truy xuất dữ liệu từ bảng `KnowledgeBase` có `status = 'ACTIVE'` để lấy câu trả lời phù hợp (FAQ, chính sách, mô tả sản phẩm).
      - Sinh câu trả lời. Nếu câu hỏi liên quan đến sản phẩm cụ thể, AI trích xuất thông tin từ `Costume` và đính kèm link.
    - Ghi nhận sự kiện `CHAT_INTEREST` vào `UserBehavior` nếu nội dung tin nhắn thể hiện quan tâm đến sản phẩm/dịch vụ.
    - Lưu câu trả lời của AI vào `AiChatMessage` với `sender = 'AI'`.
    - Cập nhật `updated_at` của `AiChatSession`.
    - Trả về nội dung câu trả lời kèm các sản phẩm được đề cập (nếu có).
  * *Người dùng gọi API:* `POST /api/ai/chat` (body: `{ sessionId, message }`)
* **Lấy lịch sử tin nhắn (Get Chat History):** Người dùng có thể xem lại các tin nhắn đã trao đổi trong phiên làm việc hiện tại.
  * *Hệ thống tự động gọi API:* `GET /api/ai/chat/sessions/{sessionId}/messages` (trả về danh sách `AiChatMessage` theo `created_at` tăng dần)
* **Kết thúc phiên chat (End Chat Session):** Người dùng đóng cửa sổ chat hoặc bắt đầu hành động khác (Checkout, etc.).
  * *Quy trình nội bộ của Server:*
    - Cập nhật `AiChatSession.status = 'CLOSED'`.
  * *Hệ thống tự động gọi API:* `PUT /api/ai/chat/sessions/{sessionId}/close`

## 9. Theo dõi Đơn thuê (Order Tracking)
Sau khi đơn hàng được tạo và thanh toán, khách hàng theo dõi trạng thái đơn thuê từ đầu đến cuối vòng đời đơn.
* **Xem danh sách đơn thuê (View Orders List):** Khách hàng truy cập trang "Đơn thuê của tôi" để xem toàn bộ lịch sử đơn hàng.
  * *Quy trình nội bộ của Server:*
    - Truy xuất toàn bộ `RentalOrder` của người dùng hiện tại qua `user_id`.
    - Sắp xếp theo `created_at` giảm dần (mới nhất trước).
    - Trả về thông tin tóm tắt: `id` (Mã đơn), `created_at` (Ngày đặt), `total_rental_price` + `total_deposit` (Tổng tiền), `status` (Trạng thái hiện tại).
  * *Người dùng gọi API:* `GET /api/orders` (hoặc `GET /api/orders?pageNo=0&pageSize=10`)
* **Xem chi tiết đơn thuê (View Order Detail):** Khách hàng bấm vào một đơn cụ thể để xem toàn bộ thông tin chi tiết.
  * *Quy trình nội bộ của Server:*
    - Truy xuất `RentalOrder` và các `RentalOrderDetail` tương ứng (join `CostumeItem` → `Costume` để lấy tên, hình ảnh, size, màu).
    - Trả về đầy đủ: `receiver_name`, `receiver_phone`, `delivery_address`, `rental_start_date`, `rental_end_date`, Danh sách trang phục (tên, SKU, size, hình ảnh, `price_per_day`, `subtotal`), Chi tiết thanh toán (`total_rental_price`, `total_deposit`, `discount_amount`), `status` đơn hàng, `return_status` từng món.
  * *Người dùng gọi API:* `GET /api/orders/{orderId}`
* **Vòng đời trạng thái đơn thuê (Order Status Flow):** Đơn thuê `RentalOrder` trải qua các giai đoạn sau (trạng thái được Staff cập nhật qua bảng `CostumeHandover`):
  * `PENDING`: Đơn đã tạo, chờ thanh toán → Sau khi thanh toán thành công, chờ Staff xác nhận.
  * `CONFIRMED`: Staff đã xác nhận đơn, đang chuẩn bị hàng. (Staff tạo bản ghi `CostumeHandover` với `type = 'PICKUP'`, `staff_id`, `handled_at`).
  * `PICKED_UP`: Trang phục đã được bàn giao cho khách, đang trong giai đoạn thuê. (Staff cập nhật `RentalOrder.status = 'PICKED_UP'`).
  * `RETURNED`: Khách đã trả đồ, trang phục hoàn trả nguyên vẹn. (Staff tạo `CostumeHandover` với `type = 'RETURN'`, cập nhật `RentalOrder.status = 'RETURNED'`, đồng thời cập nhật `RentalOrderDetail.return_status = 'RETURNED'` và `CostumeItem.status = 'AVAILABLE'`).
  * `CANCELLED`: Đơn bị hủy (bởi khách hoặc Staff trước khi bàn giao).
  * *Các trạng thái đặc biệt của từng món đồ (`RentalOrderDetail.return_status`):*
    - `NOT_RETURNED`: Chưa trả (đang thuê hoặc chưa đến hạn trả).
    - `RETURNED`: Đã trả, nguyên vẹn.
    - `DAMAGED`: Đã trả nhưng có hư hỏng (Staff đánh dấu, xử lý bồi thường theo chính sách).
    - `LOST`: Trang phục bị mất (xử lý bồi thường).
  * *Hệ thống tự động gọi API:* `GET /api/orders/{orderId}/timeline` (trả về danh sách `CostumeHandover` kèm `staff_id`, `type`, `handled_at`, `note`)
* **Nhận thông báo cập nhật (Notifications):** Khi Staff cập nhật trạng thái đơn qua `CostumeHandover`, hệ thống gửi thông báo cho khách hàng:
  * Email thông báo.
  * (Tùy chọn) Push notification / In-app notification.
  * Nội dung: Mã đơn, Trạng thái mới, Thông tin bổ sung.

## 10. Quản lý Tài khoản (Account Management)
Khách hàng xem và cập nhật thông tin cá nhân của mình trong hệ thống.
* **Xem thông tin tài khoản (View Profile):** Khách hàng truy cập trang "Tài khoản" hoặc "Hồ sơ" để xem toàn bộ thông tin đã đăng ký.
  * *Quy trình nội bộ của Server:*
    - Truy xuất thông tin `User` từ Database (các cột: `full_name`, `email`, `email_verified`, `phone`, `phone_verified`, `role`, `status`, `created_at`).
    - Trả về thông tin (KHÔNG trả về `password_hash`).
  * *Người dùng gọi API:* `GET /api/users/profile`
* **Cập nhật thông tin cá nhân (Update Profile):** Khách hàng chỉnh sửa `full_name`, `phone`, `email`.
  * *Quy trình nội bộ của Server:*
    - Validate dữ liệu đầu vào (Email đúng định dạng, SĐT đủ 10 số).
    - **Nếu sửa `email`:** Kiểm tra email mới có bị trùng với tài khoản khác không. Nếu hợp lệ, cập nhật `User.email_verified = false` và yêu cầu thực hiện lại quy trình xác thực Gmail OTP (luồng xác thực tương tự bước Đăng ký — `POST /api/auth/register/request-otp` gửi mã 6 số, `POST /api/auth/register/verify-otp` xác thực và cập nhật `email_verified = true`). Khách phải hoàn tất xác thực email mới thì tài khoản mới được kích hoạt đầy đủ.
    - **Nếu chỉ sửa `full_name` hoặc `phone`:** Cập nhật trực tiếp vào bản ghi `User` trong Database, KHÔNG reset trạng thái xác thực (`email_verified` giữ nguyên).
  * *Người dùng gọi API:* `PUT /api/users/profile`
* **Đổi mật khẩu (Change Password):** Khách hàng thay đổi mật khẩu đăng nhập.
  * *Quy trình nội bộ của Server:*
    - Yêu cầu khách nhập mật khẩu hiện tại để xác thực.
    - Validate mật khẩu mới (độ dài tối thiểu, không trùng mật khẩu cũ).
    - Mã hóa mật khẩu mới (hash) và cập nhật `password_hash` vào Database.
    - Vô hiệu hóa tất cả các `refreshToken` cũ (yêu cầu đăng nhập lại để đảm bảo bảo mật).
  * *Người dùng gọi API:* `POST /api/users/change-password` (body: `{ currentPassword, newPassword }`)