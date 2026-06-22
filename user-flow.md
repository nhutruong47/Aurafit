# User Flow - Dự án AuraFit

Tài liệu này mô tả luồng thao tác của người dùng dựa trên các tính năng hiện có trong hệ thống.

## 1. Khách vãng lai duyệt catalog
- Người dùng có thể truy cập trang chủ hoặc danh mục mà không cần đăng nhập.
- Hệ thống gọi:
  - `GET /api/public/catalog/categories`
  - `GET /api/public/catalog/costumes?...`
  - `GET /api/public/catalog/costumes/{id}`
- Người dùng có thể xem danh sách sản phẩm, lọc theo danh mục, tìm kiếm theo từ khóa, và xem chi tiết một bộ trang phục.

## 2. Xác thực người dùng
- Để thực hiện thao tác cá nhân như thêm vào giỏ hàng, hệ thống yêu cầu người dùng đăng nhập.

### Đăng ký
- Nếu dùng Gmail:
  - yêu cầu OTP qua `POST /api/auth/register/request-otp`
  - xác thực OTP và hoàn tất đăng ký qua `POST /api/auth/register/verify-otp`
- Nếu không phải Gmail:
  - đăng ký trực tiếp qua `POST /api/users/register`

### Đăng nhập
- Người dùng đăng nhập qua `POST /api/users/login`
- Hệ thống trả về:
  - `accessToken` trong response body
  - `refreshToken` trong HttpOnly cookie

## 3. Quản lý giỏ hàng
- Từ trang chi tiết sản phẩm, người dùng chọn món đồ vật lý cụ thể, ngày thuê, ngày trả, sau đó thêm vào giỏ.
- API liên quan:
  - `POST /api/cart/add`
  - `GET /api/cart`
  - `DELETE /api/cart/remove/{cartItemId}`
- Quy tắc nghiệp vụ:
  - ngày trả phải sau ngày thuê
  - item phải ở trạng thái `AVAILABLE`
  - không được thêm trùng cùng một SKU vật lý

## 4. Checkout
- Frontend gửi danh sách SKU cần thuê cùng thông tin người nhận.
- API chính:
  - `POST /api/orders/checkout`
- Backend xử lý:
  - xác thực user qua JWT
  - kiểm tra tồn kho
  - tính tổng tiền thuê, tiền cọc, giảm giá
  - tạo `RentalOrder` trạng thái `PENDING`
  - tạo `RentalOrderDetail`
  - chuyển `CostumeItem.status` sang `RENTED`
  - dọn các item tương ứng khỏi giỏ hàng nếu cần

## 5. Thanh toán
- Sau checkout, người dùng khởi tạo thanh toán cho đơn hàng.
- API:
  - `POST /api/payment/create`
  - `POST /api/public/payment/sepay-webhook`
- Backend:
  - tạo hoặc dùng lại bản ghi `Payment`
  - sinh mã thanh toán VietQR
  - nhận webhook SePay để xác nhận chuyển khoản
  - khi thành công:
    - `Payment.status = PAID`
    - `RentalOrder.status = CONFIRMED`

## 6. Theo dõi đơn hàng
- Người dùng có thể xem:
  - danh sách đơn qua `GET /api/orders`
  - chi tiết đơn qua `GET /api/orders/{orderId}`
- Trạng thái đơn chính:
  - `PENDING`
  - `CONFIRMED`
  - `PICKED_UP`
  - `RETURNED`
  - `CANCELLED`

## 7. Chat và gợi ý AI
- Frontend đã có UI cho chat và recommendation, nhưng backend hiện chưa triển khai đầy đủ các API tương ứng.
- Các flow này nên được xem là định hướng hoặc mock cho đến khi backend hỗ trợ thật.

## 8. Quản lý tài khoản
- Hiện trạng code cho thấy:
  - đăng nhập / đăng ký đã có
  - profile update / change password vẫn chưa hoàn thiện đầy đủ ở backend
- Khi làm tiếp phần này cần kiểm tra lại `API_CONTEXT.md` và `BACKEND_CONTEXT.md`.
