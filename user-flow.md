# user-flow.md

## Mục đích
- File này mô tả luồng người dùng dựa trên code hiện tại.
- Tách rõ:
  - luồng đã chạy thật end-to-end
  - luồng có backend nhưng frontend chưa expose đầy đủ
  - luồng frontend-only / mock

## 1. Khách vãng lai duyệt catalog
- Có thể vào:
  - `/`
  - `/catalog`
  - `/shop`
  - `/products/:productId`
- Frontend tải categories từ `GET /api/public/catalog/categories`.
- Frontend tải costume list/detail chủ yếu qua compatibility endpoints:
  - `GET /api/costumes`
  - `GET /api/costumes/{id}`
  - `GET /api/costumes/seasonal`
  - `GET /api/costumes/recommendations`

## 2. Đăng ký / đăng nhập

### Flow frontend hiện tại
- `/account`
- Đăng nhập:
  - `POST /api/users/login`
  - lưu `accessToken` vào local state/localStorage
  - refresh token vào HttpOnly cookie
- Đăng ký:
  - UI hiện chỉ hỗ trợ Gmail OTP flow
  - Step 1: `POST /api/auth/register/request-otp`
  - Step 2: `POST /api/auth/register/verify-otp`

### Khả năng backend có sẵn nhưng frontend chưa expose đầy đủ
- `POST /api/users/register` cho direct register non-Gmail
- `POST /api/users/register` với Gmail cũng có thể trigger OTP flow, nhưng frontend không dùng cách này

## 3. Thêm vào giỏ hàng
- Nếu user đã đăng nhập và sản phẩm có đủ:
  - `costumeItemId`
  - `rentalStartDate`
  - `rentalEndDate`
- Frontend gọi:
  - `POST /api/cart/add`
  - sau đó load lại `GET /api/cart`
- Nếu item không đủ dữ liệu backend, frontend fallback về local cart.
- Đây là lý do cart hiện tại vẫn là hybrid flow.

## 4. Checkout
- Từ `/checkout`
- Frontend gom payload:
  - `receiverName`
  - `receiverPhone`
  - `deliveryAddress`
  - `items[]` theo SKU
- Gọi:
  - `POST /api/orders/checkout`
- Backend:
  - validate item list
  - validate item availability
  - validate rental dates
  - khóa inventory bằng cách set `CostumeItem.status = RENTED`
  - tạo `RentalOrder.status = PENDING`
  - xóa các SKU vừa đặt khỏi active cart nếu có

## 5. Payment
- Sau checkout, frontend lưu `pendingOrderId` vào Zustand/localStorage.
- Từ `/payment`:
  - lấy lại order detail qua `GET /api/orders/{orderId}`
  - gọi `POST /api/payment/create`
- Backend trả:
  - `qrImageUrl`
  - `paymentContent`
  - `amount`
  - `orderId`
- Sau khi SePay webhook thành công:
  - `Payment.status = PAID`
  - `RentalOrder.status = CONFIRMED`

## 6. Lịch sử đơn hàng customer
- Từ `/orders`
- Frontend gọi:
  - `GET /api/orders`
  - `GET /api/orders/{orderId}`
- Frontend có helper `fetchOrderTimeline`, nhưng backend hiện không có endpoint timeline.

## 7. Dashboard staff
- Từ `/staff`
- Yêu cầu role `STAFF` hoặc `ADMIN`
- Frontend gọi:
  - `GET /api/orders/staff`
  - `GET /api/orders/staff/{orderId}`
  - `POST /api/orders/{orderId}/handover/pickup`
  - `POST /api/orders/{orderId}/handover/return`
- Hiện tại:
  - biên bản handover đã được lưu thật
  - return có cập nhật `returnStatus`
  - nếu `RETURNED` thì item về `AVAILABLE`
  - staff form có upload ảnh, nhưng pure `STAFF` sẽ gặp role mismatch với upload API hiện tại
  - Need verify in code: workflow có cần đổi `RentalOrder.status` sang `PICKED_UP/RETURNED/COMPLETED` hay không

## 8. Dashboard admin
- Từ `/admin`
- Yêu cầu role `ADMIN`
- Product management tab đã gọi thật:
  - `GET /api/admin/costumes`
  - `POST /api/admin/costumes`
  - `PUT /api/admin/costumes/{id}`
- Overview / support / reports hiện vẫn là data hard-code trong frontend.

## 9. Upload hình ảnh
- Frontend admin form có thể upload hình qua:
  - `POST /api/uploads/images`
- Backend upload lên Cloudinary và trả `secureUrl`.
- Frontend staff form cũng dùng uploader này cho handover image, nhưng backend hiện không cấp quyền `STAFF`.

## 10. Các luồng chưa có backend thật
- Chat assistant
- Product reviews / rating
- Order timeline `/api/orders/{id}/timeline`

## 11. Admin cap nhat AI metadata
- Tu `/admin`, admin chon mot san pham va mo panel `AI Metadata`.
- Frontend goi:
  - `GET /api/admin/costumes/{costumeId}/ai-metadata`
  - `PUT /api/admin/costumes/{costumeId}/ai-metadata`
- Backend:
  - luu metadata
  - build `searchable_text`
  - tao / cap nhat embedding cho costume

## 12. Admin quan ly fashion trends
- Tu `/admin`, admin co panel `Fashion Trend`.
- Frontend goi:
  - `GET /api/admin/fashion-trends`
  - `POST /api/admin/fashion-trends`
  - `PUT /api/admin/fashion-trends/{trendId}`
- Trend duoc su dung nhu mot signal tang diem cho recommendation.

## 13. User nhan goi y AI
- HomePage:
  - neu user da login, frontend goi `GET /api/ai/recommendations/me`
- ShopPage:
  - tab recommendation cu van dung `GET /api/costumes/recommendations`
  - AI Stylist Box goi `POST /api/ai/recommendations/query`
- Product detail:
  - goi `POST /api/ai/recommendations/outfit-combos`
- Neu AI provider loi hoac chua co key:
  - backend van tra result qua fallback rule-based

## 14. Behavior tracking AI
- Frontend da gui:
  - `VIEW_PRODUCT`
  - `SEARCH`
  - `APPLY_FILTER`
  - `ADD_TO_CART`
  - `CLICK_RECOMMENDATION`
- Backend tu ghi them:
  - `ADD_TO_CART` khi cart service luu thanh cong
  - `COMPLETE_RENTAL` khi payment webhook confirm
