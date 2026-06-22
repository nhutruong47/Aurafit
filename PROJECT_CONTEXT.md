# PROJECT_CONTEXT.md

## Tổng quan dự án
- `AuraFit` là một nền tảng cho thuê trang phục.
- Backend hiện tại đã triển khai:
  - catalog công khai
  - đăng ký/đăng nhập/JWT
  - luồng đăng ký OTP Gmail
  - giỏ hàng
  - checkout/tạo đơn hàng
  - khởi tạo thanh toán VietQR + xác nhận webhook SePay
- Frontend hiện tại đã có giao diện hoàn chỉnh cho:
  - duyệt sản phẩm
  - giỏ hàng/checkout/thanh toán
  - tài khoản
  - lịch sử đơn hàng
  - dashboard admin
  - dashboard staff
  - chat
- Quan trọng: frontend và backend mới chỉ tích hợp một phần.

## Tech stack
| Phần | Công nghệ |
| --- | --- |
| Backend | Java 17, Spring Boot 3.2.5, Spring Web, Spring Data JPA, Spring Security, Validation, Mail |
| Auth | JWT access token + refresh token cookie |
| Tài liệu API | springdoc OpenAPI / Swagger UI |
| Database | PostgreSQL 15 |
| Frontend | React 19, Vite 8, Tailwind CSS 3 |
| State frontend | Redux Toolkit, React Redux |
| Hạ tầng | Docker Compose cho Postgres + pgAdmin |

## Cấu trúc thư mục chính
| Đường dẫn | Mục đích |
| --- | --- |
| `backend/` | API Spring Boot và logic domain |
| `frontend/` | Ứng dụng React |
| `docker-compose.yml` | Postgres và pgAdmin local |
| `memory.md` | Lịch sử phát triển / kế hoạch theo phase |
| `user-flow.md` | Tài liệu luồng người dùng, đã được chuẩn hóa theo code hiện tại |

## Module backend chính
- Auth / OTP
- Xác thực người dùng / refresh session
- Catalog công khai
- Cart
- Checkout / orders
- Payment / webhook
- Security / JWT
- Seed data

## Module frontend chính
- App shell với điều hướng theo URL
- Các trang mua sắm công khai: home, catalog, shop, cosplay, events, yearbook
- Trang tài khoản/xác thực
- Các trang checkout/thanh toán/thành công đơn hàng
- Trang lịch sử đơn hàng
- UI dashboard admin
- UI dashboard staff
- UI chat

## Vai trò người dùng tìm thấy trong code
| Vai trò | Nguồn |
| --- | --- |
| `CUSTOMER` | enum `Role` ở backend |
| `STAFF` | enum `Role` ở backend |
| `ADMIN` | enum `Role` ở backend |

- Không tìm thấy role `patient` / `doctor` trong mã nguồn. Cần xác nhận nếu các tên này đến từ domain hoặc dự án khác.

## Luồng nghiệp vụ quan trọng
- Khách vãng lai duyệt catalog mà không cần đăng nhập.
- Người dùng đăng ký:
  - Gmail có thể dùng OTP flow qua `/api/auth/register/...`
  - email không phải Gmail có thể đăng ký trực tiếp qua `/api/users/register`
- Người dùng đăng nhập qua `/api/users/login`, nhận:
  - access token trong body response
  - refresh token trong cookie HttpOnly
- Người dùng đã xác thực thêm một `CostumeItem` vật lý vào giỏ hàng.
- Checkout tạo `RentalOrder` từ danh sách SKU và khóa tồn kho.
- Khởi tạo thanh toán sinh dữ liệu VietQR cho đơn hàng đang ở trạng thái `PENDING`.
- SePay webhook đánh dấu thanh toán `PAID` và đơn hàng `CONFIRMED`.

## Phần còn thiếu hoặc mới làm dở
- Backend CRUD sản phẩm cho admin: chưa có
- Backend workflow pickup/return cho staff: chưa có
- Backend API AI recommendation/chat: chưa có
- Frontend đang gọi một số endpoint chưa tồn tại ở backend
- Một số flow frontend vẫn còn mang tính demo/mock
