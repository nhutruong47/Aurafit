# memory.md

## Mục đích
- File này lưu lại các phase và trạng thái phát triển lớn của dự án.
- Nó không thay thế `PROJECT_CONTEXT.md`; nó là timeline tổng hợp.

## Phase 1: Nền tảng backend
- Đã setup Spring Boot + PostgreSQL.
- Đã có auth có JWT và refresh token cookie.
- Đã có global exception handler.
- Đã có catalog public.

## Phase 2: Shopping flow cơ bản
- Đã có `Costume` / `CostumeItem` tách riêng.
- Đã có cart backend.
- Đã có checkout tạo `RentalOrder`.
- Đã có payment init + webhook SePay.

## Phase 3: Upload và mở rộng domain
- Đã có upload image qua Cloudinary.
- Đã có `UploadAsset` để lưu metadata file.
- Đã có seed data cho categories / costumes / costume items.

## Phase 4: Operational APIs
- Đã có admin API:
  - list costume
  - create costume
  - update costume
- Đã có staff API:
  - list order
  - order detail
  - pickup handover
  - return handover

## Phase 5: Frontend integration
- Đã nối thật:
  - auth
  - cart
  - checkout
  - payment
  - customer orders
  - admin products
  - staff handover
- Vẫn còn partial / mock:
  - chat
  - reviews
  - interactions tracking
  - order timeline
  - admin overview/support/reports
  - checkout pricing UI

## Trạng thái hiện tại cần ghi nhớ
- OTP hiện lưu trong DB `otp_verifications`, không còn là in-memory cache.
- Auth response JSON chỉ trả `accessToken` và `user`; refresh token đi qua cookie.
- Repo đang có 2 bộ endpoint catalog song song:
  - `/api/public/catalog/*`
  - `/api/costumes*`, `/api/categories`
- Recommendations endpoint đã có, nhưng implementation hiện tại là random, không phải AI.
- Docker Postgres port mapping và sample `DATABASE_URL` trong `.env.example` đang lệch nhau.
- Staff UI có upload ảnh handover, nhưng backend upload endpoint hiện không cấp quyền `STAFF`.

## Backlog lớn còn mở
- Chốt secret-management workflow qua env
- Chốt lại pricing semantics giữa order và payment
- Chốt cart source of truth
- Chốt workflow order status cho staff handover
- Căn chỉnh upload role cho staff
- Chốt chiến lược catalog endpoint
- Thêm migration tool và test profile
