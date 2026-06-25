# TODO_CONTEXT.md

## P0: Cực kỳ quan trọng

### Đồng bộ service layer frontend với backend thật
- Module:
  - `frontend/src/services/`
  - auth/cart/orders/payment hooks/pages
- Checklist:
  - [ ] Thay path sai bằng endpoint backend thật
  - [ ] Normalize wrapped backend response trước khi UI dùng
  - [ ] Thêm bearer token + cookie-aware request handling
  - [ ] Cập nhật flow order/payment theo DTO thật

### Loại bỏ secret đã commit
- Module:
  - `backend/src/main/resources/application-dev.yml`
  - `backend/src/main/resources/application.yml`
- Checklist:
  - [ ] Rotate Gmail password đã lộ và các secret liên quan
  - [ ] Chuyển secret sang env vars
  - [ ] Bổ sung hướng dẫn tải `.env` / secret

### Sửa bất nhất giữa quantity và mô hình SKU vật lý
- Module:
  - domain checkout/order ở `backend`
- Checklist:
  - [ ] Quyết định một `CostumeItem` có thể đại diện cho quantity > 1 hay không
  - [ ] Bỏ hoặc thiết kế lại `quantity`
  - [ ] Cập nhật DTO, service, order detail model, tài liệu

### Sửa exception hướng API trong cart flow
- Module:
  - `CartServiceImpl`
  - `GlobalExceptionHandler`
- Checklist:
  - [ ] Thay generic runtime exception
  - [ ] Trả `4xx` ổn định cho validation/conflict nghiệp vụ

## P1: Nên làm sớm

### Thêm test profile đúng nghĩa
- Module:
  - `backend/src/test`
  - cấu hình Spring
- Checklist:
  - [ ] Thêm test DB cô lập hoặc in-memory nếu phù hợp
  - [ ] Không để `mvn test` phụ thuộc Docker local thủ công

### Thêm database migration
- Module:
  - persistence/infrastructure backend
- Checklist:
  - [ ] Đưa Flyway hoặc Liquibase vào dự án
  - [ ] Baseline schema hiện tại
  - [ ] Ngừng phụ thuộc vào `ddl-auto: update`

### Quyết định phạm vi staff/admin
- Module:
  - dashboard staff/admin ở frontend
  - endpoint backend còn thiếu
- Checklist:
  - [ ] Xác nhận UI là mock/demo hay bắt buộc phải chạy thật
  - [ ] Triển khai API còn thiếu hoặc ẩn action chưa hỗ trợ
  - [ ] Đồng bộ vocabulary status giữa FE/BE

### Làm rõ chính sách đăng ký
- Module:
  - auth/user flows
- Checklist:
  - [ ] Xác nhận yêu cầu OTP chỉ cho Gmail
  - [ ] Xác nhận luật đăng ký trực tiếp với non-Gmail
  - [ ] Tài liệu hóa hành vi `emailVerified`

## P2: Cải thiện / Refactor

### Tách nhỏ các page/component frontend quá lớn
- Module:
  - `Checkout.jsx`
  - `AdminDashboard.jsx`
  - `StaffDashboard.jsx`
  - `Navbar.jsx`
  - `ProductReviewsSection.jsx`
- Checklist:
  - [ ] Tách hook có state
  - [ ] Tách presentational subcomponent
  - [ ] Giảm độ phức tạp orchestration ở page level

### Chuẩn hóa domain dictionary
- Module:
  - mapping status ở frontend
  - enum ở backend
  - context docs
- Checklist:
  - [ ] Dùng enum backend làm nguồn chân lý
  - [ ] Loại bỏ status cũ như `PENDING_CONFIRMATION`

### Cải thiện hygiene cho prompting
- Module:
  - các file context ở root
- Checklist:
  - [ ] Giữ tài liệu luôn được cập nhật khi endpoint/model thay đổi
  - [ ] Thêm changelog section sau nếu team muốn
