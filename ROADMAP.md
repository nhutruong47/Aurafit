# ROADMAP.md

## Mục tiêu
- Đưa AuraFit từ trạng thái "backend core đã có thật + frontend còn nhiều phần mock/lệch contract" sang trạng thái:
  - FE/BE giao tiếp đúng
  - flow thuê đồ chạy end-to-end
  - bảo mật/devops ổn định hơn
  - phạm vi admin/staff rõ ràng

## Cách dùng
- `[x]` = đã hoàn thành
- `[ ]` = chưa hoàn thành
- Chỉ tick khi code hoặc tài liệu tương ứng đã thực sự xong

## Phase 0: Context và Audit
- [x] Đọc toàn bộ codebase hiện tại
- [x] Tổng hợp context file cho AI/Codex
- [x] Chuẩn hóa `user-flow.md` theo code hiện tại
- [x] Tổng hợp rủi ro chính trong `RISK.md`
- [x] Tổng hợp backlog ưu tiên trong `TODO_CONTEXT.md`
- [x] Thêm rule để các file context markdown được Git track

## Phase 1: Ổn định nền tảng
### Security / Config
- [ ] Rotate secret Gmail SMTP đã lộ trong repo
- [ ] Chuyển secret sang env vars hoặc secret store
- [ ] Rà soát lại `jwt.secret` cho production
- [ ] Tài liệu hóa các biến môi trường cần có cho backend

### Backend Reliability
- [ ] Thay `IllegalArgumentException` / `IllegalStateException` ở cart flow bằng custom exception
- [ ] Chuẩn hóa HTTP `4xx` cho validation/conflict nghiệp vụ
- [ ] Kiểm tra lại semantics giữa `finalAmount`, `totalRentalPrice`, `totalDeposit`, `payment amount`
- [ ] Xác nhận rule `quantity` trong checkout theo mô hình `CostumeItem` vật lý

### Testing / Local Setup
- [ ] Tạo test profile không phụ thuộc Postgres local đang chạy sẵn
- [ ] Làm cho `.\\mvnw.cmd test` chạy ổn định trong môi trường mới
- [ ] Tài liệu hóa thứ tự chạy local: Docker -> Backend -> Frontend

## Phase 2: Đồng bộ frontend và backend
### API Layer
- [ ] Đồng bộ path API catalog về `/api/public/catalog/...`
- [ ] Đồng bộ payment API về `/api/payment/create`
- [ ] Thêm bearer token + refresh cookie handling đúng cách
- [ ] Normalize response wrapper `ApiResponse<T>` ở frontend service layer

### Auth / User State
- [ ] Sửa flow login/register để frontend nhận đúng `data.user`
- [ ] Sửa helper role parsing để tương thích response thật từ backend
- [ ] Kiểm tra lại luồng Gmail OTP với UI frontend

### Catalog / Product Mapping
- [ ] Sửa `productMapper` để đọc `costume.category.name`
- [ ] Đồng bộ field `CostumeDTO` với UI hiện tại
- [ ] Xử lý đúng response phân trang của catalog API

## Phase 3: Hoàn thiện customer flow end-to-end
### Cart
- [ ] Quyết định source of truth cho cart: local-only hay backend-first
- [ ] Nếu backend-first: nối `GET /api/cart`, `POST /api/cart/add`, `DELETE /api/cart/remove/{id}`
- [ ] Đồng bộ pricing cart với dữ liệu backend

### Checkout
- [ ] Nối form checkout frontend với `POST /api/orders/checkout`
- [ ] Gửi đúng payload SKU + rental dates + receiver info
- [ ] Hiển thị lỗi tồn kho/ngày thuê từ backend

### Payment
- [ ] Bỏ `demoOrderId` hard-code trong `Payment.jsx`
- [ ] Dùng `orderId` thật từ checkout response
- [ ] Hiển thị QR, amount, payment content từ backend
- [ ] Kiểm tra luồng sau webhook SePay: `PENDING -> CONFIRMED`

### Orders
- [ ] Sửa `useUserOrders` dùng `GET /api/orders`
- [ ] Nối order detail bằng `GET /api/orders/{orderId}`
- [ ] Đồng bộ status hiển thị với enum backend thực tế

## Phase 4: Làm rõ phạm vi admin / staff
### Quyết định scope
- [ ] Xác nhận dashboard admin/staff là mock demo hay cần chạy thật
- [ ] Xác nhận danh sách API staff/admin bắt buộc
- [ ] Xác nhận vocabulary status dùng chung FE/BE

### Nếu làm thật
- [ ] Thêm backend API CRUD sản phẩm cho admin
- [ ] Thêm backend API staff order list/detail
- [ ] Thêm backend API pickup/return handover
- [ ] Đồng bộ `useAdminProducts` với backend thật
- [ ] Đồng bộ `useStaffOrders` với backend thật

### Nếu chưa làm thật
- [ ] Gắn nhãn rõ các màn hình mock/prototype
- [ ] Ẩn hoặc disable action chưa được backend hỗ trợ

## Phase 5: Data / Schema / DevOps
### Database
- [ ] Thêm Flyway hoặc Liquibase
- [ ] Baseline schema hiện tại
- [ ] Bỏ phụ thuộc `ddl-auto: update` cho môi trường nghiêm túc hơn
- [ ] Xem xét unique constraint cho active cart per user
- [ ] Xem xét đổi tên bảng `"User"` nếu gây friction cho migration/tooling

### Deployment / Ops
- [ ] Tách config dev/prod rõ ràng hơn
- [ ] Tài liệu hóa health check và startup checklist
- [ ] Xem xét idempotency cho webhook SePay

## Phase 6: Nâng chất lượng code
### Frontend Refactor
- [ ] Tách nhỏ `Checkout.jsx`
- [ ] Tách nhỏ `Navbar.jsx`
- [ ] Tách nhỏ `AdminDashboard.jsx`
- [ ] Tách nhỏ `StaffDashboard.jsx`
- [ ] Tách nhỏ `ProductReviewsSection.jsx`

### Consistency
- [ ] Chuẩn hóa status dictionary frontend theo enum backend
- [ ] Chuẩn hóa nội dung tiếng Việt / tiếng Anh
- [ ] Loại bỏ flow mock không còn dùng

## Phase 7: Phạm vi tương lai
- [ ] Xác nhận lại các tính năng AI trong `memory.md`
- [ ] Xác nhận có thực sự cần recommendation engine hay không
- [ ] Xác nhận có thực sự cần chat assistant hay không
- [ ] Xác nhận có cần timeline/handover/rating/upload module riêng hay không

## Quick wins nên làm ngay
- [ ] Sửa secret bị lộ trong repo
- [ ] Đồng bộ frontend API layer
- [ ] Sửa auth response mapping ở frontend
- [ ] Sửa order history hook đang gọi nhầm staff endpoint
- [ ] Sửa payment page đang hard-code `demoOrderId`

## Definition of Done
- [ ] Frontend build pass: `npm exec vite build`
- [ ] Backend test pass: `.\\mvnw.cmd test`
- [ ] Docker infra khởi động được: `docker compose up -d`
- [ ] Customer flow chạy được end-to-end:
  - [ ] duyệt catalog
  - [ ] đăng nhập/đăng ký
  - [ ] thêm vào giỏ hàng
  - [ ] checkout
  - [ ] khởi tạo thanh toán
  - [ ] xem đơn hàng
- [ ] Context docs được cập nhật lại sau mỗi thay đổi lớn
