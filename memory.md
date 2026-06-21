# Dự án AuraFit (SBA301) - Bộ nhớ quá trình làm việc

Tài liệu này lưu trữ tiến độ và các tính năng đã được hoàn thành trong quá trình phát triển dự án.

## Phase 1: Kiến trúc Lõi & Bảo mật (Core Architecture & Auth)
- **Khởi tạo Database Local:** Chạy PostgreSQL qua Docker, cấu hình kết nối Spring Boot (`dev` profile).
- **Thiết kế CSDL (Entities):** Ánh xạ 6 bảng chính (`Category`, `Costume`, `CostumeItem`, `RentalOrder`, `RentalOrderDetail`, `Payment`) với chế độ chặn lỗi N+1 Query (`FetchType.LAZY`).
- **Xử lý Lỗi Toàn cục:** Tạo cơ chế bắt lỗi tập trung (Global Exception Handler) chuẩn hóa JSON trả về cho các mã lỗi 400, 401, 403, 404, 500.
- **Chuẩn hóa API Đăng nhập:** Áp dụng chuẩn DTO để giấu Password, tách biệt logic HTTP ra khỏi Service.
- **Bảo mật Spring Security 6:** Chuyển đổi sang chuẩn mới (Lambda DSL), cấu hình CORS cho Frontend React, phân quyền Stateless API, và bảo vệ Refresh Token bằng HttpOnly Cookie.

## Phase 2: API Danh mục Sản phẩm (Catalog API)
- **Thiết kế DTO Response:** Tạo các bản ghi (`CategoryDTO`, `CostumeDTO`) và class `PaginatedResponse<T>` dùng chung cho mọi API cần phân trang sau này.
- **Tối ưu hóa Truy vấn (JPQL):** Dùng `JOIN FETCH` để tối ưu số lần gọi database (từ 21 queries xuống còn 1 query) khi tải danh sách sản phẩm.
- **Xây dựng API Catalog Công khai:**
  - `GET /api/public/catalog/categories`: Lấy danh sách thể loại cho Sidebar.
  - `GET /api/public/catalog/costumes`: Lấy danh sách trang phục có kèm **Phân trang** (Pagination) và **Lọc** (Tìm kiếm theo keyword, lọc theo Category ID).
  - `GET /api/public/catalog/costumes/{id}`: Xem chi tiết 1 trang phục.
- **Fix lỗi dữ liệu rỗng (PostgreSQL):** Sửa lỗi Postgres không đọc được keyword null bằng cách chuẩn hóa sang String rỗng (`""`).
- **Data Seeder:** Tạo class `DataInitializer` tự động khởi tạo dữ liệu mẫu (3 danh mục, 8 bộ trang phục kèm hình ảnh thật) mỗi khi chạy app. Đặc biệt, cập nhật data mẫu để chứa cả các mặt hàng vật lý (`CostumeItem`) với các SKU riêng biệt (Size S, M, L).

## Phase 3: Quản lý Giỏ hàng (Shopping Cart API) - Part 1
- **Domain Driven Design:** Tách biệt rõ ràng giữa `Costume` (Mẫu mã để hiển thị Catalog) và `CostumeItem` (Sản phẩm vật lý có mã SKU, Size, Màu sắc để tính tồn kho).
- **Thực thể Cart & CartItem:** Tạo mới bảng `carts` (Quản lý trạng thái `ACTIVE`, `CHECKED_OUT`, `ABANDONED`) và `cart_items` (Ghi nhận thời gian thuê và giá tiền). Thiết lập quan hệ với tính năng `orphanRemoval = true`.
- **Anti-IDOR Security:** Xây dựng `CartController` bảo mật nghiêm ngặt, tuyệt đối không nhận `userId` từ request body mà tự động bóc tách (extract) từ JWT Security Context (email của người đang đăng nhập).
- **Cart Service Logic:** Xử lý nghiệp vụ phức tạp của giỏ hàng bao gồm:
  - Tự động tạo giỏ hàng trống nếu user chưa có.
  - Validate tính hợp lệ của ngày thuê (`rentalEndDate > rentalStartDate`).
  - Kiểm tra trạng thái khả dụng (`AVAILABLE`) của món đồ vật lý (SKU).
  - Ngăn chặn việc thêm trùng lặp một mã vật lý (`SKU`) vào cùng một giỏ hàng.
  - Tự động tính toán số ngày thuê bằng `ChronoUnit.DAYS`, sau đó quy đổi ra `subtotal` và tổng giá trị giỏ hàng `totalCartValue`.
- **Tối ưu Database Queries:** Sử dụng Custom JPQL `JOIN FETCH` để fetch 3 cấp độ (`Cart` -> `CartItem` -> `CostumeItem` -> `Costume`) chỉ bằng 1 câu lệnh SQL duy nhất, dập tắt tận gốc lỗi N+1 Query khi ánh xạ sang đối tượng DTO trả về cho Frontend.
## Phase 3 - Part 2: Tiến trình Đặt hàng, Thanh toán & Trợ lý AI (Kế hoạch thực hiện)
Giai đoạn tiếp theo mở rộng hệ thống từ quản lý giỏ hàng sang toàn bộ vòng đời đơn thuê, tích hợp thanh toán và xây dựng trợ lý AI. Toàn bộ logic Backend phải tuân thủ nghiêm ngặt Database Schema chính thức đã được duyệt.

### 1. Đăng ký tài khoản kèm xác thực Gmail OTP (Registration with Email Verification)
- **Quy trình 2 bước (2-Step Registration):** Xác thực email qua Gmail OTP được thực hiện ngay tại bước Đăng ký. Mọi tài khoản sau khi đăng ký và đăng nhập mặc định đã được xác thực (`email_verified = true`), không cần xác thực lại tại bước Checkout.
- **Bước 1 — Yêu cầu gửi OTP:** `POST /api/auth/register/request-otp`
  - Tiếp nhận email từ request body.
  - Kiểm tra email đã tồn tại trong hệ thống chưa. Nếu trùng → báo lỗi.
  - Sinh mã OTP 6 chữ số ngẫu nhiên, lưu vào `ConcurrentHashMap<String, OtpEntry>` với key = `email`, TTL 5 phút.
  - Gửi mã OTP qua email thông qua `JavaMailSender` (Gmail SMTP với App Password).
- **Bước 2 — Xác thực OTP & Tạo tài khoản:** `POST /api/auth/register/verify-otp`
  - Tiếp nhận email, mã OTP, và thông tin tài khoản (`password`, `full_name`, `phone`).
  - Verify mã OTP trực tiếp từ cache (`ConcurrentHashMap`). Sai hoặc hết hạn (quá 5 phút) → báo lỗi.
  - Xóa entry OTP khỏi cache sau khi verify thành công.
  - Mã hóa mật khẩu (hash), tạo bản ghi `User` với `email_verified = true`, lưu vào Database.
- **Cấu hình hạ tầng:**
  - `JavaMailSender`: Cấu hình Gmail SMTP với App Password trong `application-dev.yml` / `application-prod.yml`.
  - `EmailService`: Gửi email HTML có mã OTP từ template.
  - `OtpService`: Quản lý cache `ConcurrentHashMap<String, OtpEntry>` — sinh OTP, verify (so khớp mã + kiểm tra TTL), xóa entry.
  - `OtpEntry`: Model lưu trữ `{ otpCode, createdAt, expiresAt }` để so sánh và tính TTL.
- **Các bảng liên quan:** `User`.
- **Dự phóng API:** `POST /api/auth/register/request-otp`, `POST /api/auth/register/verify-otp`.

### 2. Tiến trình Đặt hàng (Checkout) — `POST /api/orders/checkout`
- **Logic giỏ hàng thuần túy (không có OTP):** Checkout là xử lý tạo đơn thuê trực tiếp từ giỏ hàng, không cần bất kỳ bước xác thực email OTP nào (vì tài khoản đã được xác thực ngay khi đăng ký).
- **Quy trình nội bộ (bọc trong `@Transactional`):**
  - Extract `user_id` từ JWT Security Context.
  - Truy xuất `Cart` có `status = 'ACTIVE'` và các `CartItem` liên kết của người dùng hiện tại.
  - Kiểm tra tồn kho: Tất cả `CostumeItem` liên kết phải có `status = 'AVAILABLE'`. Nếu bất kỳ SKU nào đang `RENTED` bởi đơn khác → báo lỗi không cho đặt chồng.
  - Tính toán bằng `BigDecimal`:
    - `total_rental_price` = Σ(Số ngày thuê × `price_per_day` từ `CostumeItem`).
    - `total_deposit` = Σ(`deposit_amount` từ `CostumeItem`).
    - `discount_amount` = Áp dụng promo code (nếu có).
  - Tạo `RentalOrder` với `status = 'PENDING'`, ghi nhận `receiver_name`, `receiver_phone`, `delivery_address` (từ request body).
  - Tạo `RentalOrderDetail` cho từng `CartItem`, mỗi bản ghi có `return_status = 'NOT_RETURNED'`, `price_per_day`, `rental_days`, `subtotal`.
  - Cập nhật `Cart.status = 'CHECKED_OUT'`.
  - Cập nhật `CostumeItem.status = 'RENTED'` để khóa tồn kho.
- **Các bảng liên quan:** `Cart`, `CartItem`, `CostumeItem`, `RentalOrder`, `RentalOrderDetail`.
- **Dự phóng API:** `POST /api/orders/checkout`.

### 3. Thanh toán tự động qua VietQR & Đối soát Webhook SePay
- **Khởi tạo thanh toán VietQR:** Cấu hình thông tin tài khoản đích cố định (`BIDV`, `8824354356`, `BUI LE HUY HOANG`). Tự động sinh `payment_code` dạng `ARF{orderId}` làm cú pháp nội dung chuyển khoản bắt buộc. Trả link ảnh VietQR động dạng `https://img.vietqr.io/image/...`.
- **Xây dựng Xử lý Webhook SePay:**
  * Tạo Endpoint public `POST /api/public/payment/sepay-webhook` nhận cấu trúc dữ liệu JSON giao dịch từ SePay.
  * Kiểm tra tính hợp lệ của Webhook Token trong Header (X-SePay-Auth-Token) để chống giả mạo request.
  * Phân tích chuỗi nội dung chuyển khoản (`content`), dùng Regex trích xuất ID đơn hàng sau tiền tố `ARF`.
  * Khớp số tiền, cập nhật trạng thái đồng bộ: Bọc luồng trong `@Transactional` để cập nhật Payment (status = 'PAID', lưu mã tham chiếu giao dịch vào trường transaction_id có kiểu dữ liệu là String, khoá chính Payment giữ nguyên kiểu Long để tương thích mở rộng), đồng thời đẩy trực tiếp trạng thái
- **Các bảng liên quan:** `Payment`, `RentalOrder`.
- **Dự phóng API:** `POST /api/payment/create`, `POST /api/public/payment/sepay-webhook`.


### 4. AI Engine — Ghi nhận Hành vi & Gợi Ý Sản phẩm
- **Track Behavior — `POST /api/ai/track`:** Ghi nhận sự kiện vào `UserBehavior` với các `action_type` hợp lệ: `VIEW`, `CLICK`, `FAVORITE`, `ADD_TO_CART`, `RENT`, `CHAT_INTEREST`.
  - AI Engine tổng hợp hành vi theo `Category` qua `costume_id` → `Costume.category_id`, tính trọng số, cập nhật `UserPreference.preference_score`.
- **Gợi Ý — `GET /api/ai/recommendations`:**
  - **Đã đăng nhập:** Join `UserPreference` → `Category` (ưu tiên theo `preference_score` giảm dần) kết hợp `SeasonalTrend` (lọc ngày hiện tại, ưu tiên theo `priority_score`) → Query `Costume` + `CostumeItem.status = 'AVAILABLE'`.
  - **Guest:** Fallback `SeasonalTrend` + `PopularProducts` (thống kê `action_type = 'RENT'` trong `UserBehavior`).
- **Gợi Ý Theo Ngữ Cảnh:** `GET /api/ai/recommendations/similar/{costumeId}` (cùng danh mục), `GET /api/ai/recommendations/complementary` (trang giỏ hàng).
- **Các bảng liên quan:** `UserBehavior`, `UserPreference`, `SeasonalTrend`, `Category`, `Costume`, `CostumeItem`.
- **Dự phóng API:** `POST /api/ai/track`, `GET /api/ai/recommendations`, `GET /api/ai/recommendations/similar/{costumeId}`, `GET /api/ai/recommendations/complementary`.

### 5. Chat với AI (AI Assistant) — `POST /api/ai/chat`
- **Khởi tạo phiên:** `POST /api/ai/chat/sessions` → Tạo `AiChatSession` với `status = 'ACTIVE'`, trả về `sessionId`.
- **Gửi tin nhắn:** Nhận `{ sessionId, message }`, lưu `AiChatMessage` với `sender = 'USER'`.
  - AI Engine phân tích ý định (`detected_intent`), trích xuất `detected_category_id` (nếu có) → Ghi vào `AiChatMessage`.
  - Truy xuất `KnowledgeBase` có `status = 'ACTIVE'` để lấy câu trả lời từ dữ liệu tri thức nội bộ.
  - Nếu nội dung thể hiện quan tâm sản phẩm → ghi `CHAT_INTEREST` vào `UserBehavior`.
  - Lưu phản hồi AI với `sender = 'AI'` vào `AiChatMessage`. Cập nhật `updated_at` của `AiChatSession`.
- **Lịch sử & Đóng phiên:** `GET /api/ai/chat/sessions/{sessionId}/messages` (danh sách message theo `created_at`), `PUT /api/ai/chat/sessions/{sessionId}/close` (cập nhật `status = 'CLOSED'`).
- **Các bảng liên quan:** `AiChatSession`, `AiChatMessage`, `KnowledgeBase`, `UserBehavior`, `Category`, `Costume`.
- **Dự phóng API:** `POST /api/ai/chat/sessions`, `POST /api/ai/chat`, `GET /api/ai/chat/sessions/{sessionId}/messages`, `PUT /api/ai/chat/sessions/{sessionId}/close`.

### 6. Theo dõi Đơn thuê — `GET /api/orders` & `GET /api/orders/{orderId}`
- **Danh sách đơn:** Truy xuất `RentalOrder` theo `user_id` (extract từ JWT), sắp xếp `created_at` giảm dần. Trả tóm tắt: `id`, `created_at`, `total_rental_price`, `total_deposit`, `status`.
- **Chi tiết đơn:** Join `RentalOrderDetail` → `CostumeItem` → `Costume` để trả đầy đủ thông tin: `receiver_name`, `receiver_phone`, `delivery_address`, `rental_start_date`, `rental_end_date`, danh sách trang phục (tên, SKU, size, hình ảnh, `price_per_day`, `subtotal`, `return_status`), chi tiết thanh toán (`total_rental_price`, `total_deposit`, `discount_amount`).
- **Timeline đơn:** `GET /api/orders/{orderId}/timeline` → Trả danh sách `CostumeHandover` kèm `staff_id`, `type` (`PICKUP`/`RETURN`), `handled_at`, `note`.
- **Các trạng thái đơn (`RentalOrder.status`):** `PENDING` → `CONFIRMED` → `PICKED_UP` → `RETURNED` / `CANCELLED`.
- **Các trạng thái trả đồ (`RentalOrderDetail.return_status`):** `NOT_RETURNED` → `RETURNED` / `DAMAGED` / `LOST`.
- **Các bảng liên quan:** `RentalOrder`, `RentalOrderDetail`, `CostumeItem`, `Costume`, `CostumeHandover`, `User`.
- **Dự phóng API:** `GET /api/orders`, `GET /api/orders/{orderId}`, `GET /api/orders/{orderId}/timeline`.

### 7. Quản lý Tài khoản
- **Xem hồ sơ:** `GET /api/users/profile` → Trả `User` (không bao gồm `password_hash`): `full_name`, `email`, `email_verified`, `phone`, `phone_verified`, `role`, `status`, `created_at`.
- **Cập nhật hồ sơ:** `PUT /api/users/profile` → Validate input, kiểm tra trùng email nếu có thay đổi.
  - **Nếu sửa `email`:** Cập nhật `User.email_verified = false`, yêu cầu thực hiện lại quy trình xác thực Gmail OTP (gọi `POST /api/auth/register/request-otp` → `POST /api/auth/register/verify-otp` để cập nhật `email_verified = true`). Khách phải hoàn tất xác thực email mới thì tài khoản mới được kích hoạt đầy đủ.
  - **Nếu chỉ sửa `full_name` hoặc `phone`:** Cập nhật trực tiếp vào bản ghi `User`, KHÔNG reset trạng thái xác thực.
- **Đổi mật khẩu:** `POST /api/users/change-password` → Xác thực `currentPassword`, hash `newPassword`, cập nhật `password_hash`, vô hiệu hóa toàn bộ `refreshToken` cũ.
- **Các bảng liên quan:** `User`.
- **Dự phóng API:** `GET /api/users/profile`, `PUT /api/users/profile`, `POST /api/users/change-password`.