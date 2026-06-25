# TODO_CONTEXT.md

## P0: Cần ưu tiên cao

### Chuẩn hóa secret management qua env
- Module:
  - `backend/.env.example`
  - `backend/src/main/resources/application.yml`
  - `backend/src/main/resources/application-dev.yml`
- Checklist:
  - [ ] Tài liệu hóa đầy đủ env vars bắt buộc
  - [ ] Xác nhận local `.env` không bị chia sẻ / commit nhầm
  - [ ] Tách các secret thật khỏi mọi kênh chia sẻ tài liệu / source khác nếu còn sót

### Sửa lệch setup Postgres local
- Module:
  - `docker-compose.yml`
  - `backend/.env.example`
- Checklist:
  - [ ] Chốt host port chính thức cho local dev
  - [ ] Đồng bộ lại Docker compose và sample `DATABASE_URL`
  - [ ] Cập nhật README / context setup

### Chốt lại semantics pricing order / payment
- Module:
  - `OrderResponse`
  - `RentalOrder`
  - `PaymentServiceImpl`
  - `frontend/src/pages/RentalOrderCheckoutPage.jsx`
  - `frontend/src/pages/PaymentPage.jsx`
- Checklist:
  - [ ] Chốt `finalAmount` là gì
  - [ ] Chốt tổng khách phải trả có gồm deposit hay không
  - [ ] Đồng bộ FE/BE và tài liệu

### Xử lý lệch `quantity` với inventory model
- Module:
  - checkout / order domain
- Checklist:
  - [ ] Quyết định có giữ `quantity` hay bỏ
  - [ ] Nếu giữ, thiết kế lại model cho phù hợp
  - [ ] Nếu bỏ, cập nhật DTO / UI / docs

### Chuẩn hóa exception hướng API trong cart
- Module:
  - `CartServiceImpl`
  - `GlobalExceptionHandler`
- Checklist:
  - [ ] Thay runtime exception generic bằng custom exception
  - [ ] Đảm bảo trả 4xx ổn định cho conflict / validation

## P1: Nên làm sớm

### Chốt cart source of truth
- Module:
  - `App.jsx`
  - `cartSlice.js`
  - `RentalOrderCheckoutPage.jsx`
- Checklist:
  - [ ] Quyết định backend-first hay hybrid
  - [ ] Nếu backend-first, bỏ local fallback không cần thiết
  - [ ] Đồng bộ pricing cart theo backend

### Hoàn thiện workflow staff
- Module:
  - `StaffServiceImpl`
  - `StaffDashboardPage`
- Checklist:
  - [ ] Xác nhận order status cần đổi khi pickup / return
  - [ ] Cập nhật service nếu cần
  - [ ] Đồng bộ UI status và docs

### Căn chỉnh upload role giữa staff UI và backend
- Module:
  - `UploadController`
  - `StaffDashboardPage`
  - `ImageUploadField`
- Checklist:
  - [ ] Quyết định staff có được upload ảnh handover hay không
  - [ ] Nếu có, mở quyền backend và test lại
  - [ ] Nếu không, ẩn / đổi UX staff cho rõ

### Chốt chiến lược catalog API
- Module:
  - `CatalogController`
  - `PublicCatalogController`
  - frontend catalog services
- Checklist:
  - [ ] Quyết định giữ hay bỏ compatibility endpoints
  - [ ] Hợp nhất service layer frontend nếu cần
  - [ ] Cập nhật context docs

### Làm rõ auth/register UX
- Module:
  - `UserController`
  - `AccountAuthForm.jsx`
- Checklist:
  - [ ] Xác nhận có cần direct register non-Gmail trên frontend hay không
  - [ ] Nếu có, bổ sung UI
  - [ ] Nếu không, tài liệu hóa rõ hạn chế

### Thêm test profile backend
- Module:
  - `backend/src/test`
  - spring test config
- Checklist:
  - [ ] Tách khỏi DB local thật
  - [ ] Làm `.\\mvnw.cmd test` ổn định hơn

### Thêm migration tool
- Module:
  - backend persistence
- Checklist:
  - [ ] Chọn Flyway hoặc Liquibase
  - [ ] Baseline schema hiện tại
  - [ ] Giảm phụ thuộc `ddl-auto: update`

## P2: Cải thiện / refactor

### Làm thật hoặc đánh dấu mock cho các vùng UI chưa có backend
- Module:
  - chat
  - reviews
  - interactions
  - admin overview/support/reports
  - order timeline helper
- Checklist:
  - [ ] Ghi rõ "mock/prototype" trên UI nếu cần
  - [ ] Hoặc ẩn action chưa support

### Tách nhỏ page / component lớn
- Module:
  - `Navbar.jsx`
  - `RentalOrderCheckoutPage.jsx`
  - `AdminDashboardPage.jsx`
  - `StaffDashboardPage.jsx`
  - `ProductReviewsSection.jsx`

### Chuẩn hóa docs sau mỗi thay đổi lớn
- Checklist:
  - [ ] Cập nhật `API_CONTEXT.md` khi endpoint đổi
  - [ ] Cập nhật `DATABASE_CONTEXT.md` khi entity / enum đổi
  - [ ] Cập nhật `user-flow.md` khi FE/BE flow đổi

## AI Recommendation roadmap

### Phase 1 - da xong
- [x] Admin product AI metadata CRUD
- [x] Admin fashion trend CRUD
- [x] User behavior tracking API
- [x] Personalized/query/outfit combo APIs
- [x] Frontend AI Stylist Box + personalized section + outfit combo section
- [x] Fallback local embedding + rule-based reason

### Phase 2 - tiep theo
- [ ] Danh gia va bat `pgvector` neu catalog tang
- [ ] Them migration tool truoc khi baseline schema AI
- [ ] Mở rong behavior signal tu wishlist khi domain nay ton tai
- [ ] Batch refresh profile/embedding thay vi chi lazy compute
- [ ] Quan tri prompt/versioning ro hon cho AI provider
