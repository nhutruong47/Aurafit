# BACKEND_CONTEXT.md

## Tổng quan backend
- Ứng dụng Spring Boot có root package là `com.aurafit`.
- Trọng tâm hiện tại là luồng thương mại cho thuê:
  - auth
  - catalog
  - cart
  - checkout
  - payment

## Cấu trúc
| Package | Mục đích |
| --- | --- |
| `controller` | REST endpoint |
| `service` | Service và interface nghiệp vụ |
| `service.impl` | Triển khai cụ thể của nghiệp vụ |
| `repository` | JPA repository |
| `entity` | Persistence model |
| `dto.request` | Request contract có validate |
| `dto.response` | Response DTO |
| `security` | JWT filter/token/user details |
| `config` | Security, OpenAPI, seed data |
| `exception` | Loại exception + global handler |

## Controllers
| Controller | Endpoint |
| --- | --- |
| `AuthController` | request OTP / verify register |
| `UserController` | register, login, refresh |
| `PublicCatalogController` | categories, costumes list, costume detail |
| `CartController` | lấy giỏ hàng, thêm item, xóa item |
| `CheckoutController` | checkout, danh sách đơn, chi tiết đơn |
| `PaymentController` | khởi tạo thanh toán |
| `SePayWebhookController` | webhook thanh toán |

## Service chính
| Service | Trách nhiệm |
| --- | --- |
| `AuthService` | Luồng đăng ký Gmail OTP và tạo auth response |
| `UserServiceImpl` | Đăng ký trực tiếp, đăng nhập, refresh |
| `CartServiceImpl` | Vòng đời giỏ hàng active và tính giá cart item |
| `CheckoutServiceImpl` | Tạo đơn hàng có transaction và khóa tồn kho |
| `PaymentServiceImpl` | Khởi tạo VietQR và đối soát webhook SePay |
| `OtpService` | Lưu trữ và validate OTP in-memory |
| `EmailService` | Gửi email OTP HTML |
| `CostumeServiceImpl` | Endpoint đọc catalog |

## Security / Guard / Middleware
- `SecurityConfig`
  - `/api/auth/**`, `/api/users/register|login|refresh`, `/api/public/**`, Swagger là public
  - tất cả endpoint còn lại yêu cầu JWT
- `JwtAuthenticationFilter`
  - đọc `Authorization: Bearer <token>`
  - load user details và set Spring Security context
- `JwtTokenProvider`
  - sinh access và refresh JWT
  - lưu claim `userId`, `role`, `tokenType`
- Không tìm thấy custom authorization guard theo role trên endpoint.

## Ghi chú về validation / DTO
- Request DTO dùng `jakarta.validation`.
- Kiểu response đang bị trộn:
  - endpoint auth/user bọc trong `ApiResponse`
  - catalog/cart/order/payment chủ yếu trả DTO trực tiếp
- DTO quan trọng:
  - `VerifyOtpRequestDTO`
  - `AddToCartRequestDTO`
  - `CheckoutRequest`
  - `PaymentCreateRequest`
  - `OrderResponse`
  - `CartDTO`

## Background / scheduled work
- Không tìm thấy cron hay scheduled job.
- `DataInitializer` chạy khi app startup dưới `dev` profile.
- OTP cache là in-memory, không phải background worker.

## Quy tắc nghiệp vụ quan trọng tìm thấy trong code
- Ownership của người dùng đã xác thực được suy ra từ JWT email, không lấy từ request body.
- Gmail OTP flow được enforce trong `AuthService.requestOtp`.
- Đăng ký trực tiếp không phải Gmail vẫn được cho phép qua `UserController.register`.
- Cart chỉ chấp nhận `CostumeItem` đang ở trạng thái `AVAILABLE`.
- Không thể thêm cùng một món đồ vật lý hai lần vào cùng một giỏ hàng.
- Checkout khóa từng `CostumeItem` đã đặt bằng cách set status thành `RENTED`.
- Chỉ có thể khởi tạo thanh toán cho đơn hàng đang `PENDING`.
- SePay webhook sẽ set:
  - `Payment.status = PAID`
  - `RentalOrder.status = CONFIRMED`

## Cần xác minh / phần chưa có trong code
| Chủ đề | Trạng thái |
| --- | --- |
| API pickup/return cho staff | Chưa có |
| API quản lý sản phẩm cho admin | Chưa có |
| Cập nhật profile / đổi mật khẩu | Chưa có |
| Lưu trữ rating/review | Chưa có |
| Upload/media storage | Chưa có |
| Engine AI recommendation/chat | Chưa có ở backend |
