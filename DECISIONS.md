# DECISIONS.md

## Các quyết định kỹ thuật đã được xác nhận trong code

### PostgreSQL là database chính
- Bằng chứng:
  - `docker-compose.yml`
  - `application-dev.yml`
  - `application-prod.yml`
- Lý do:
  - Domain order/cart/payment dạng quan hệ rất phù hợp với JPA mapping.
- Mức tin cậy:
  - Cao

### Spring Boot + JPA + lazy entity + fetch join
- Bằng chứng:
  - các query `JOIN FETCH` trong repository
  - mapping entity
- Lý do:
  - Tránh N+1 và giữ domain model theo kiểu quan hệ.
- Mức tin cậy:
  - Cao

### JWT access token + refresh token cookie
- Bằng chứng:
  - `UserController`
  - `JwtTokenProvider`
  - `SecurityConfig`
- Lý do:
  - Access token trong body/header, refresh token trong cookie HttpOnly.
- Mức tin cậy:
  - Cao

### Inventory được tách giữa catalog product và đơn vị vật lý
- Quyết định:
  - `Costume` là mẫu hiển thị ở catalog
  - `CostumeItem` là đơn vị vật lý có thể cho thuê
- Bằng chứng:
  - entity, cart flow, checkout flow
- Mức tin cậy:
  - Cao

### Endpoint checkout dùng chung
- Quyết định:
  - Một API checkout nhận danh sách SKU cho cả buy-now và cart flow.
- Bằng chứng:
  - `CheckoutController`
  - `CheckoutServiceImpl`
- Mức tin cậy:
  - Cao

### Luồng thanh toán VietQR + webhook SePay
- Bằng chứng:
  - `PaymentServiceImpl`
  - `PaymentController`
  - `SePayWebhookController`
- Mức tin cậy:
  - Cao

### Seed data dev chỉ chạy dưới `dev` profile
- Bằng chứng:
  - `DataInitializer` có annotation `@Profile("dev")`
- Mức tin cậy:
  - Cao

### Frontend chia state: Redux cho auth/cart, React Router cho điều hướng
- Bằng chứng:
  - `store/store.js`
  - `authSlice.js`
  - `cartSlice.js`
  - `App.jsx`
  - `routing/navigation.js`
- Mức tin cậy:
  - Cao

## Các quyết định có vẻ là chủ ý nhưng cần xác nhận

### OTP chỉ áp dụng cho địa chỉ Gmail
- Bằng chứng:
  - `AuthService.requestOtp`
- Cần xác nhận:
  - Đây là yêu cầu nghiệp vụ thật hay chỉ là triển khai tạm thời?

### Đăng ký trực tiếp cho email không phải Gmail vẫn được cho phép
- Bằng chứng:
  - `UserController.register`
  - `UserServiceImpl.register`
- Cần xác nhận:
  - Chính sách đăng ký hỗn hợp này có phải chủ ý dài hạn hay không?

### `finalAmount` không bao gồm tiền cọc trong response đơn hàng
- Bằng chứng:
  - `OrderResponse.fromEntity`
- Cần xác nhận:
  - Số tiền hiển thị cho khách có nên bao gồm tiền cọc hay không?

### Dashboard staff/admin ở frontend là định hướng sản phẩm nhưng backend chưa triển khai tương ứng
- Bằng chứng:
  - hook/page frontend đang kỳ vọng các API chưa có ở backend
- Cần xác nhận:
  - Các màn hình này chỉ là prototype hay cần làm chạy thật?

## Không tìm thấy trong code
- Redis: không dùng
- RabbitMQ: không dùng
- Mô hình role doctor/patient: không dùng
- Booking/appointment engine: không có
- Lưu trữ rating: không có
- Upload/media backend: không có
