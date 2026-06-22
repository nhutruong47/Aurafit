# API_CONTEXT.md

## Ghi chú
- File này mô tả các API backend đã được triển khai trong `backend/`.
- `Need verify in code` nghĩa là flow được nhắc ở nơi khác nhưng chưa được triển khai tại đây.
- Nhiều lệnh gọi API từ frontend chưa khớp với các endpoint này. Xem `RISK.md`.

## API auth và user
| Method | Endpoint | Auth | Mục đích | Request | Response | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register/request-otp` | Public | Gửi OTP tới địa chỉ Gmail | `{ email }` | `ApiResponse<OtpSentResponse>` | Từ chối email không phải Gmail |
| `POST` | `/api/auth/register/verify-otp` | Public | Xác thực OTP và tạo/cập nhật user | `{ email, otpCode, fullName, phone, password }` | `ApiResponse<AuthResponseDTO>` | Trả access token trong body, refresh token bị ẩn trong JSON |
| `POST` | `/api/users/register` | Public | Đăng ký trực tiếp cho luồng không dùng Gmail | `RegisterRequest` | `ApiResponse<Void or status>` | Nếu là Gmail thì trả thông báo OTP |
| `POST` | `/api/users/login` | Public | Đăng nhập | `{ email, password }` | `ApiResponse<AuthResponseDTO>` + `Set-Cookie: refreshToken` | Cookie là HttpOnly |
| `POST` | `/api/users/refresh` | Public | Làm mới access token | cookie `refreshToken` | `ApiResponse<AuthResponseDTO>` + cookie mới | Đọc token từ cookie |

### `AuthResponseDTO`
```json
{
  "accessToken": "jwt",
  "user": {
    "id": 1,
    "fullName": "User Name",
    "email": "user@example.com",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

## API catalog công khai
| Method | Endpoint | Auth | Mục đích | Request | Response | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/api/public/catalog/categories` | Public | Lấy danh sách category | none | `CategoryDTO[]` | Không có wrapper |
| `GET` | `/api/public/catalog/costumes` | Public | Lấy danh sách costume active có phân trang | query: `categoryId`, `keyword`, `pageNo`, `pageSize`, `sortBy`, `sortDir` | `PaginatedResponse<CostumeDTO>` | Frontend hiện tại vẫn kỳ vọng sai shape/path |
| `GET` | `/api/public/catalog/costumes/{id}` | Public | Chi tiết costume | path `id` | `CostumeDTO` | Response không chứa danh sách inventory item |

## API giỏ hàng
| Method | Endpoint | Auth | Mục đích | Request | Response | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/api/cart` | Bearer JWT | Lấy/tạo giỏ hàng active | none | `CartDTO` | Dùng user từ JWT |
| `POST` | `/api/cart/add` | Bearer JWT | Thêm món đồ vật lý vào giỏ | `{ costumeItemId, rentalStartDate, rentalEndDate }` | `CartDTO` | Quantity mặc định ngầm là 1 |
| `DELETE` | `/api/cart/remove/{cartItemId}` | Bearer JWT | Xóa cart item | path `cartItemId` | `CartDTO` | Tính lại tổng giỏ hàng |

## API đơn hàng / checkout
| Method | Endpoint | Auth | Mục đích | Request | Response | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/api/orders/checkout` | Bearer JWT | Tạo rental order `PENDING` từ danh sách SKU | `CheckoutRequest` | `OrderResponse` | Luồng buy-now/cart dùng chung |
| `GET` | `/api/orders` | Bearer JWT | Lấy danh sách đơn của user hiện tại | none | `OrderSummaryResponse[]` | Sắp xếp theo `createdAt desc` |
| `GET` | `/api/orders/{orderId}` | Bearer JWT | Lấy chi tiết đơn của user hiện tại | path `orderId` | `OrderResponse` | Chỉ cho phép chủ đơn |

### `CheckoutRequest`
```json
{
  "receiverName": "Nguyen Van A",
  "receiverPhone": "0900000000",
  "deliveryAddress": "123 Example St",
  "items": [
    {
      "sku": "AF-001-M-1",
      "quantity": 1,
      "rentalStartDate": "2026-06-25",
      "rentalEndDate": "2026-06-28"
    }
  ]
}
```

### `OrderResponse`
- Các field chính:
  - `id`
  - `userId`
  - `receiverName`
  - `receiverPhone`
  - `deliveryAddress`
  - `totalRentalPrice`
  - `totalDeposit`
  - `discountAmount`
  - `finalAmount`
  - `status`
  - `rentalStartDate`
  - `rentalEndDate`
  - `createdAt`
  - `details[]`
- Quan trọng:
  - `finalAmount = totalRentalPrice - discountAmount`
  - Tiền cọc không nằm trong `finalAmount`
  - Cần xác minh xem đây có phải số tiền khách thực sự phải trả hay không

## API thanh toán
| Method | Endpoint | Auth | Mục đích | Request | Response | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/api/payment/create` | Bearer JWT | Tạo hoặc dùng lại payment đang pending và trả dữ liệu VietQR | `{ orderId }` | `PaymentInitResponse` | Đơn phải thuộc user hiện tại và đang `PENDING` |
| `POST` | `/api/public/payment/sepay-webhook` | Public + header token | Xác nhận chuyển khoản ngân hàng | header `X-SePay-Auth-Token`, body `SePayWebhookRequest` | `{ status, message }` | Đánh dấu payment `PAID`, order `CONFIRMED` |

### `PaymentInitResponse`
```json
{
  "qrImageUrl": "https://img.vietqr.io/image/...",
  "paymentContent": "ARF123",
  "amount": 1250000,
  "orderId": 123
}
```

## API upload ảnh
| Method | Endpoint | Auth | Mục đích | Request | Response | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/api/uploads/images` | Bearer JWT, role `ADMIN` hoặc `CUSTOMER` | Upload ảnh signed qua backend lên Cloudinary và lưu metadata DB | `multipart/form-data`, field `file` | `UploadAssetResponse` | Chỉ chấp nhận `jpg`, `jpeg`, `png`, `webp`; reject file rỗng; có giới hạn size |

### `UploadAssetResponse`
```json
{
  "id": 1,
  "originalFileName": "avatar.png",
  "url": "http://res.cloudinary.com/...",
  "secureUrl": "https://res.cloudinary.com/...",
  "publicId": "aurafit/avatar-abc123",
  "resourceType": "image",
  "format": "png",
  "size": 123456,
  "uploadedAt": "2026-06-22T10:00:00"
}
```

- Giai đoạn hiện tại frontend admin dùng upload này để lấy `secureUrl` rồi gán vào `Costume.imageUrl`.
- Flow rating/review chưa được nối vì backend review module chưa tồn tại.

## Contract lỗi
- Format lỗi global:
```json
{
  "timestamp": "2026-06-22T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed - ...",
  "path": "/api/..."
}
```

## API còn thiếu hoặc cần xác minh
| API | Trạng thái |
| --- | --- |
| Tạo/cập nhật/xóa sản phẩm cho admin | Chưa có ở backend |
| Staff order list/detail | Chưa có ở backend |
| API pickup/return handover | Chưa có ở backend |
| AI recommendations / AI chat / interaction tracking | Chưa có ở backend |
| Cập nhật profile user / đổi mật khẩu | Chưa có ở backend |
| Timeline endpoint `/api/orders/{id}/timeline` | Chưa có ở backend |
| Review/rating có upload ảnh | Chưa có ở backend |

## Phần frontend đang kỳ vọng nhưng backend thiếu hoặc lệch
| Lệnh gọi từ frontend | Thực tế backend hiện tại |
| --- | --- |
| `GET /api/costumes` | Thực tế là `GET /api/public/catalog/costumes` |
| `GET /api/costumes/seasonal` | Chưa có |
| `GET /api/costumes/recommendations` | Chưa có |
| `POST /api/payments` | Thực tế là `POST /api/payment/create` |
| `POST /api/interactions` | Chưa có |
| `GET /api/orders/staff` | Chưa có |
| `GET /api/orders/staff/{id}` | Chưa có |
| `POST /api/orders/{id}/handover/...` | Chưa có |
