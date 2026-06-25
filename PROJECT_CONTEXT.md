# PROJECT_CONTEXT.md

## Tổng quan dự án
- `AuraFit` là monorepo gồm:
  - `backend/`: Spring Boot REST API
  - `frontend/`: React + Vite SPA
  - `docker-compose.yml`: Postgres + pgAdmin cho local dev
- Domain hiện tại tập trung vào:
  - catalog trang phục
  - auth / register / login / refresh
  - cart
  - checkout / rental order
  - payment qua VietQR + webhook SePay
  - admin costume management
  - staff handover pickup / return
  - upload hình ảnh lên Cloudinary

## Trạng thái thực tế của hệ thống

### Backend đã có
- Đăng ký Gmail qua OTP:
  - `POST /api/auth/register/request-otp`
  - `POST /api/auth/register/verify-otp`
- Đăng ký qua `POST /api/users/register`:
  - email Gmail -> không tạo user trực tiếp, trả OTP-sent response
  - email non-Gmail -> tạo user trực tiếp
- Đăng nhập / refresh:
  - `POST /api/users/login`
  - `POST /api/users/refresh`
- Catalog public:
  - `GET /api/public/catalog/categories`
  - `GET /api/public/catalog/costumes`
  - `GET /api/public/catalog/costumes/{id}`
- Catalog compatibility layer:
  - `GET /api/categories`
  - `GET /api/costumes`
  - `GET /api/costumes/{id}`
  - `GET /api/costumes/seasonal`
  - `GET /api/costumes/recommendations`
- Cart:
  - `GET /api/cart`
  - `POST /api/cart/add`
  - `DELETE /api/cart/remove/{cartItemId}`
- Orders / checkout:
  - `POST /api/orders/checkout`
  - `GET /api/orders`
  - `GET /api/orders/{orderId}`
- Payment:
  - `POST /api/payment/create`
  - `POST /api/public/payment/sepay-webhook`
- Upload:
  - `POST /api/uploads/images`
- Admin:
  - `GET /api/admin/costumes`
  - `POST /api/admin/costumes`
  - `PUT /api/admin/costumes/{id}`
- Staff / admin handover:
  - `GET /api/orders/staff`
  - `GET /api/orders/staff/{orderId}`
  - `POST /api/orders/{orderId}/handover/pickup`
  - `POST /api/orders/{orderId}/handover/return`

### Frontend đã có
- Route customer:
  - `/`, `/catalog`, `/shop`, `/products/:productId`
  - `/checkout`, `/payment`, `/success`, `/orders`
  - `/account`
- Route operational / marketing:
  - `/admin`, `/staff`, `/chat`
  - `/yearbook`, `/cosplay`, `/events`, `/care`
- State management:
  - Redux Toolkit cho `auth` và `cart`
  - Zustand cho `pendingOrderId` trong payment flow
- Service layer đã tách theo domain:
  - auth
  - catalog public
  - catalog compatibility + admin costume
  - cart
  - orders / staff handover
  - payment
  - upload
  - interactions

## Mức độ tích hợp hiện tại

### Đã tích hợp thật
- Login / refresh / OTP register đã gọi backend thật.
- Cart ưu tiên đồng bộ backend khi user đăng nhập và item đủ dữ liệu backend.
- Checkout tạo `RentalOrder` thật và lưu `pendingOrderId`.
- Payment page gọi `POST /api/payment/create` thật.
- Orders page gọi `GET /api/orders` và `GET /api/orders/{id}` thật.
- Admin product page gọi API admin thật.
- Staff dashboard gọi API staff/handover thật.

### Vẫn còn mock / partial / gap
- Chat UI chưa có backend.
- `interactionsService` gọi `/api/ai/track`, backend chưa có.
- `rentalOrderService.fetchOrderTimeline()` gọi `/api/orders/{id}/timeline`, backend chưa có.
- Product review hiện là frontend-only.
- Checkout UI vẫn tính voucher / tổng tiền theo hard-code UI, không lấy từ pricing backend.
- Cart vẫn có local fallback nếu item thiếu `costumeItemId`, `sku`, hoặc rental window.
- Admin overview / support / reports vẫn dùng data hard-code trong frontend.
- Frontend register UI chỉ hỗ trợ Gmail OTP flow, dù backend còn có direct register.
- Staff UI có upload ảnh handover, nhưng backend upload endpoint chỉ cho `ADMIN` và `CUSTOMER`, không cho `STAFF`.

## Vai trò trong hệ thống
| Role | Nguồn chân lý |
| --- | --- |
| `CUSTOMER` | `backend/src/main/java/com/aurafit/enums/Role.java` |
| `STAFF` | `backend/src/main/java/com/aurafit/enums/Role.java` |
| `ADMIN` | `backend/src/main/java/com/aurafit/enums/Role.java` |

## Đặc điểm quan trọng cần nhớ
- User ownership ở backend được suy ra từ JWT / SecurityContext, không lấy từ payload.
- OTP được persist trong bảng `otp_verifications`, không còn là in-memory cache.
- `AuthResponseDTO` chỉ serialize `accessToken` và `user`; `refreshToken` đi qua HttpOnly cookie.
- Recommendations hiện tại không phải AI; backend đang shuffle random active costumes.
- Payment amount = `totalRentalPrice + totalDeposit - discountAmount`.
- `OrderResponse.finalAmount` hiện chỉ là `totalRentalPrice - discountAmount`.
- `RentalOrder.totalPrice` được set bằng rental subtotal khi checkout, không cộng deposit.
- Staff handover hiện lưu biên bản và cập nhật `returnStatus`, nhưng không đổi `RentalOrder.status` sang `PICKED_UP`, `RETURNED`, hoặc `COMPLETED`.

## AI Recommendation MVP status
- Phase hien tai: `Phase 1 - AI Recommendation MVP da duoc implement`.
- Da co:
  - admin nhap `product_ai_metadata` cho tung costume
  - admin CRUD `fashion_trends`
  - behavior tracking qua `/api/ai/track`
  - recommendation theo query, personalized, va outfit combo
  - fallback local embedding + rule-based ranking khi khong co AI provider key
- Chua co:
  - wishlist domain yet
  - pgvector native search
  - auto-sync trend tu external source

## Need verify in code / business
- Luồng đăng ký non-Gmail có phải policy dài hạn hay chỉ là fallback tạm.
- Có nên tiếp tục giữ 2 lớp endpoint catalog song song hay hợp nhất.
- `finalAmount` có được xem là tổng tiền khách phải thanh toán hay chỉ là rental subtotal.
