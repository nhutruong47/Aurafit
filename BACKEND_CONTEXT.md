# BACKEND_CONTEXT.md

## Tổng quan backend
- Root package: `com.aurafit`
- Stack chính:
  - Java 17
  - Spring Boot 3.2.5
  - Spring Web
  - Spring Data JPA
  - Spring Security
  - Jakarta Validation
  - Java Mail
  - spring-dotenv
  - springdoc-openapi
  - Cloudinary

## Module backend hiện có
| Module | Mô tả |
| --- | --- |
| Auth / User | OTP register, hybrid register, login, refresh |
| Catalog | Public listing, detail, categories, seasonal, recommendations |
| Cart | Active cart per user, add/remove item |
| Checkout / Orders | Tạo rental order và lấy lịch sử / chi tiết |
| Payment | Tạo payment VietQR và xử lý webhook SePay |
| Upload | Upload ảnh lên Cloudinary và lưu metadata |
| Admin | List/create/update costume |
| Staff | List order staff, detail, pickup handover, return handover |

## Controllers và endpoint thật
| Controller | Endpoint chính |
| --- | --- |
| `AuthController` | `POST /api/auth/register/request-otp`, `POST /api/auth/register/verify-otp` |
| `UserController` | `POST /api/users/register`, `POST /api/users/login`, `POST /api/users/refresh` |
| `PublicCatalogController` | `/api/public/catalog/...` |
| `CatalogController` | `/api/costumes`, `/api/categories`, `/api/costumes/seasonal`, `/api/costumes/recommendations` |
| `CartController` | `GET /api/cart`, `POST /api/cart/add`, `DELETE /api/cart/remove/{cartItemId}` |
| `CheckoutController` | `POST /api/orders/checkout`, `GET /api/orders`, `GET /api/orders/{orderId}` |
| `PaymentController` | `POST /api/payment/create` |
| `SePayWebhookController` | `POST /api/public/payment/sepay-webhook` |
| `UploadController` | `POST /api/uploads/images` |
| `AdminController` | `GET/POST/PUT /api/admin/costumes...` |
| `StaffController` | `GET /api/orders/staff`, `GET /api/orders/staff/{orderId}`, handover pickup/return |

## Security
- `SecurityConfig` permit public cho:
  - `/api/auth/**`
  - `/api/users/register`, `/api/users/login`, `/api/users/refresh`
  - `/api/public/**`
  - `GET /api/costumes/**`
  - `GET /api/categories/**`
  - Swagger docs
- Còn lại yêu cầu JWT.
- Method security được bật qua `@EnableMethodSecurity`.
- Role guard hiện được đặt trên:
  - `AdminController`: `hasRole('ADMIN')`
  - `StaffController`: `hasAnyRole('STAFF', 'ADMIN')`
  - `UploadController`: `hasAnyRole('ADMIN', 'CUSTOMER')`

## Services và business logic
| Service | Trách nhiệm |
| --- | --- |
| `AuthService` | Request OTP, verify OTP, tạo auth response |
| `UserServiceImpl` | Hybrid register, login, refresh |
| `CostumeServiceImpl` | Catalog public, seasonal, recommendations |
| `CartServiceImpl` | Active cart, validate ngày thuê, pricing cart |
| `CheckoutServiceImpl` | Tạo `RentalOrder`, khóa inventory, xóa cart item đã order |
| `PaymentServiceImpl` | Init/reuse `Payment`, sinh VietQR, xử lý webhook |
| `UploadServiceImpl` | Validate file, upload Cloudinary, rollback remote nếu DB fail |
| `AdminServiceImpl` | List/create/update costume |
| `StaffServiceImpl` | Staff order detail, pickup handover, return handover |

## Hành vi nghiệp vụ đã xác nhận trong code
- Đăng ký Gmail:
  - frontend hiện dùng `POST /api/auth/register/request-otp` + `POST /api/auth/register/verify-otp`
  - `POST /api/users/register` cũng có thể nhận Gmail và delegate sang OTP flow
- Đăng ký non-Gmail:
  - được support qua `POST /api/users/register`
  - user được tạo trực tiếp
  - `emailVerified` không được set `true` trong flow này
- Auth response:
  - body JSON chỉ có `accessToken` và `user`
  - `refreshToken` được tạo nhưng bị `@JsonIgnore`
  - refresh token đi qua HttpOnly cookie do controller set
- Cart:
  - chỉ chấp nhận `CostumeItem` đang `AVAILABLE`
  - cấm thêm trùng cùng một `CostumeItem` vào cùng cart
  - tính `subtotal` theo `rentalPrice * rentalDays`
- Checkout:
  - nhận danh sách SKU vật lý
  - set `CostumeItem.status = RENTED` ngay trong transaction
  - tạo `RentalOrder.status = PENDING`
  - xóa khỏi cart các SKU vừa đặt
  - có field `quantity`, nhưng service chỉ lock 1 `CostumeItem` và chỉ tạo 1 `RentalOrderDetail` cho mỗi SKU
- Payment:
  - chỉ cho order của user hiện tại
  - chỉ init payment khi order `PENDING`
  - amount = rental + deposit - discount
  - webhook thành công sẽ set:
    - `Payment.status = PAID`
    - `RentalOrder.status = CONFIRMED`
- Staff handover:
  - pickup tạo `HandoverRecord`
  - return cập nhật `RentalOrderDetail.returnStatus`
  - nếu `returnStatus = RETURNED` thì set `CostumeItem.status = AVAILABLE`
  - service hiện không đổi `RentalOrder.status`

## Các điểm cần lưu ý khi đọc code backend
- `AuthController` vẫn có comment cũ mô tả OTP là in-memory cache, nhưng implementation thật đang lưu DB.
- `UserController.register` là hybrid endpoint, không chỉ là direct register non-Gmail.
- `OrderResponse.finalAmount` không cộng `totalDeposit`.
- `RentalOrder.totalPrice` hiện được set bằng `totalRentalPrice` khi checkout.
- `CartServiceImpl` vẫn ném `IllegalArgumentException` / `IllegalStateException`.
- `PaymentServiceImpl` đang hard-code thông tin tài khoản VietQR.
- `UploadController` không cấp quyền cho `STAFF`, trong khi frontend staff form vẫn có image uploader.

## Phần đã có nhưng chưa đầy đủ
- Admin costume:
  - có list/create/update
  - chưa có delete
- Staff workflow:
  - có handover record
  - chưa thấy order-state machine đầy đủ
- Recommendations:
  - endpoint có tồn tại
  - implementation hiện tại là shuffle random, không phải AI

## Chưa có trong backend
| Khu vực | Trạng thái |
| --- | --- |
| Review / rating | Chưa có |
| Chat assistant | Chưa có |
| User profile update / change password | Chưa có |
| Order timeline endpoint | Chưa có |
| Admin delete costume | Chưa có |

## AI Recommendation MVP da co trong backend

### Controller moi
- `AdminAiController`
  - `GET /api/admin/costumes/{costumeId}/ai-metadata`
  - `PUT /api/admin/costumes/{costumeId}/ai-metadata`
  - `GET /api/admin/fashion-trends`
  - `POST /api/admin/fashion-trends`
  - `PUT /api/admin/fashion-trends/{trendId}`
- `AiTrackingController`
  - `POST /api/ai/track`
- `AiRecommendationController`
  - `POST /api/ai/recommendations/query`
  - `GET /api/ai/recommendations/me`
  - `GET /api/ai/recommendations/users/{userId}`
  - `POST /api/ai/recommendations/outfit-combos`

### Service moi
- `AiAdminServiceImpl`
  - luu AI metadata
  - build searchable text
  - tao/upsert embedding
- `BehaviorTrackingServiceImpl`
  - nhan event tu frontend
  - ghi them event server-side khi add-to-cart va payment confirmed
- `UserPreferenceProfileServiceImpl`
  - tong hop profile so thich tu behavior + order history
- `AiRecommendationServiceImpl`
  - semantic retrieve
  - rule filter
  - optional LLM explanation
  - fallback deterministic reason

### Hanh vi da thay doi
- `GET /api/costumes/recommendations` khong con shuffle random; da bridge sang AI recommendation layer.
- `CartServiceImpl` da doi cart validation conflict sang exception huong API (`BadRequestException` / `ConflictException`).
- Payment webhook thanh cong se ghi them `COMPLETE_RENTAL` events cho AI profile.
