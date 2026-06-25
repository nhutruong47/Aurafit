# API_CONTEXT.md

## Ghi chú
- File này mô tả API backend đã tồn tại trong `backend/`.
- `Need verify in code` dùng cho business meaning chưa được code xác nhận rõ.
- Contract auth/user dùng `ApiResponse<T>`.
- Phần lớn endpoint catalog/cart/order/payment/admin/staff trả DTO trực tiếp.

## Auth và User
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register/request-otp` | Public | `ApiResponse<OtpSentResponse>` |
| `POST` | `/api/auth/register/verify-otp` | Public | `ApiResponse<AuthResponseDTO>` |
| `POST` | `/api/users/register` | Public | Hybrid `ApiResponse` |
| `POST` | `/api/users/login` | Public | `ApiResponse<AuthResponseDTO>` + `refreshToken` cookie |
| `POST` | `/api/users/refresh` | Public | `ApiResponse<AuthResponseDTO>` + refreshed cookie |

### Ghi chú auth
- OTP request nhận full registration payload:
```json
{
  "email": "user@gmail.com",
  "fullName": "Nguyen Van A",
  "phone": "0900000000",
  "password": "secret"
}
```
- Verify OTP hiện chỉ cần:
```json
{
  "email": "user@gmail.com",
  "otpCode": "123456"
}
```
- Backend lưu registration payload từ step 1 trong `otp_verifications`.
- `AuthResponseDTO` JSON chỉ gồm:
  - `accessToken`
  - `user`
- `refreshToken` được tạo nhưng bị `@JsonIgnore` và được gửi qua HttpOnly cookie.
- `POST /api/users/register` có hành vi theo email:
  - Gmail -> `200 OK`, body `ApiResponse<OtpSentResponse>`, delegate sang OTP flow
  - Non-Gmail -> `201 Created`, body `ApiResponse<Void>`, tạo user trực tiếp

## Catalog

### Public namespaced endpoints
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/api/public/catalog/categories` | Public | `CategoryDTO[]` |
| `GET` | `/api/public/catalog/costumes` | Public | `PaginatedResponse<CostumeDTO>` |
| `GET` | `/api/public/catalog/costumes/{id}` | Public | `CostumeDTO` |

### Compatibility endpoints
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/api/categories` | Public | `CategoryDTO[]` |
| `GET` | `/api/costumes` | Public | `PaginatedResponse<CostumeDTO>` |
| `GET` | `/api/costumes/{id}` | Public | `CostumeDTO` |
| `GET` | `/api/costumes/seasonal` | Public | `CostumeDTO[]` |
| `GET` | `/api/costumes/recommendations` | Public | `CostumeDTO[]` |

### Ghi chú catalog
- `/api/public/catalog/costumes` dùng query:
  - `categoryId`
  - `keyword`
  - `pageNo`
  - `pageSize`
  - `sortBy`
  - `sortDir`
- `/api/costumes` dùng query `category` dạng string để giữ compatibility với frontend.
- Recommendations hiện tại không phải AI personalization; backend đang shuffle random active costumes.

## Cart
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | Bearer JWT | `CartDTO` |
| `POST` | `/api/cart/add` | Bearer JWT | `CartDTO` |
| `DELETE` | `/api/cart/remove/{cartItemId}` | Bearer JWT | `CartDTO` |

### `POST /api/cart/add`
```json
{
  "costumeItemId": 1,
  "rentalStartDate": "2026-06-25",
  "rentalEndDate": "2026-06-28"
}
```

### `CartDTO`
- field chính:
  - `id`
  - `userId`
  - `status`
  - `items[]`
  - `totalCartValue`

## Orders / Checkout
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `POST` | `/api/orders/checkout` | Bearer JWT | `OrderResponse` |
| `GET` | `/api/orders` | Bearer JWT | `OrderSummaryResponse[]` |
| `GET` | `/api/orders/{orderId}` | Bearer JWT | `OrderResponse` |
| `GET` | `/api/orders/staff` | Bearer JWT + `STAFF/ADMIN` | `StaffOrderDetailResponse[]` |
| `GET` | `/api/orders/staff/{orderId}` | Bearer JWT + `STAFF/ADMIN` | `StaffOrderDetailResponse` |
| `POST` | `/api/orders/{orderId}/handover/pickup` | Bearer JWT + `STAFF/ADMIN` | `HandoverRecordDTO` |
| `POST` | `/api/orders/{orderId}/handover/return` | Bearer JWT + `STAFF/ADMIN` | `HandoverRecordDTO` |

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
- field chính:
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
- Hiện tại:
  - `finalAmount = totalRentalPrice - discountAmount`
  - payment amount thật = `totalRentalPrice + totalDeposit - discountAmount`

### `HandoverRequest`
```json
{
  "rentalOrderDetailId": 12,
  "returnStatus": "RETURNED",
  "imageUrl": "https://...",
  "note": "Tình trạng tốt"
}
```

### `HandoverRecordDTO`
- field chính:
  - `id`
  - `rentalOrderDetailId`
  - `staffUserId`
  - `staffUserName`
  - `handoverType`
  - `returnStatus`
  - `imageUrl`
  - `note`
  - `createdAt`

## Payment
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `POST` | `/api/payment/create` | Bearer JWT | `PaymentInitResponse` |
| `POST` | `/api/public/payment/sepay-webhook` | Public + header token | `{ "status": 200, "message": "Success" }` |

### `POST /api/payment/create`
```json
{
  "orderId": 123
}
```

### `PaymentInitResponse`
```json
{
  "qrImageUrl": "https://img.vietqr.io/image/...",
  "paymentContent": "ARF123",
  "amount": 1250000,
  "orderId": 123
}
```

### Webhook SePay
- Header bắt buộc:
  - `X-SePay-Auth-Token`
- Body field quan trọng:
  - `transfer_amount`
  - `content`
  - `code`
- Business logic:
  - đọc `ARF{orderId}` từ `content`
  - tìm `Payment` đang `PENDING`
  - yêu cầu `transferAmount >= payment.amount`
  - set `Payment.status = PAID`
  - set `RentalOrder.status = CONFIRMED`

## Upload
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `POST` | `/api/uploads/images` | Bearer JWT + `ADMIN/CUSTOMER` | `UploadAssetResponse` |

### Ghi chú upload
- `multipart/form-data`
- field file: `file`
- chấp nhận `jpg`, `jpeg`, `png`, `webp`
- metadata được lưu vào bảng `upload_assets`
- `UploadAssetResponse` có các field thường dùng:
  - `id`
  - `url`
  - `secureUrl`
  - `publicId`
  - `format`
  - `size`
  - `uploadedAt`

## Admin costumes
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/api/admin/costumes` | Bearer JWT + `ADMIN` | `AdminCostumeDTO[]` |
| `POST` | `/api/admin/costumes` | Bearer JWT + `ADMIN` | `AdminCostumeDTO` |
| `PUT` | `/api/admin/costumes/{id}` | Bearer JWT + `ADMIN` | `AdminCostumeDTO` |

### `CostumeCreateRequest`
```json
{
  "name": "New Costume",
  "description": "Mô tả",
  "rentalPrice": 250000,
  "depositPrice": 500000,
  "imageUrl": "https://...",
  "categoryId": 1
}
```

### Ghi chú admin
- Hiện chưa có endpoint delete costume.
- `AdminCostumeDTO` có thêm:
  - `availableItemCount`
  - `createdAt`
  - `updatedAt`

## Error contract
```json
{
  "timestamp": "2026-06-22T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed - ...",
  "path": "/api/..."
}
```

### Lưu ý error handling
- `BadRequestException`, `ConflictException`, `ResourceNotFoundException` đã có mapping rõ.
- `CartServiceImpl` vẫn ném `IllegalArgumentException` / `IllegalStateException`, nên một số case cart có thể rơi vào `500 Internal Server Error`.

## Endpoint / contract chưa có
| Khu vực | Trạng thái |
| --- | --- |
| User profile update / change password | Chưa có |
| Review / rating | Chưa có |
| Chat / AI assistant | Chưa có |
| Order timeline `/api/orders/{id}/timeline` | Chưa có |
| Admin delete costume | Chưa có |

## AI Recommendation MVP

### Admin AI metadata / trend
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/api/admin/costumes/{costumeId}/ai-metadata` | Bearer JWT + `ADMIN` | `ProductAiMetadataResponse` |
| `PUT` | `/api/admin/costumes/{costumeId}/ai-metadata` | Bearer JWT + `ADMIN` | `ProductAiMetadataResponse` |
| `GET` | `/api/admin/fashion-trends` | Bearer JWT + `ADMIN` | `FashionTrendResponse[]` |
| `POST` | `/api/admin/fashion-trends` | Bearer JWT + `ADMIN` | `FashionTrendResponse` |
| `PUT` | `/api/admin/fashion-trends/{trendId}` | Bearer JWT + `ADMIN` | `FashionTrendResponse` |

### Tracking
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `POST` | `/api/ai/track` | Public, co the kem JWT | `UserBehaviorTrackResponse` |

### Recommendation
| Method | Endpoint | Auth | Response |
| --- | --- | --- | --- |
| `POST` | `/api/ai/recommendations/query` | Public, co the kem JWT | `RecommendationResponse` |
| `GET` | `/api/ai/recommendations/me` | Bearer JWT | `RecommendationResponse` |
| `GET` | `/api/ai/recommendations/users/{userId}` | Bearer JWT + `ADMIN` | `RecommendationResponse` |
| `POST` | `/api/ai/recommendations/outfit-combos` | Public, co the kem JWT | `OutfitComboResponse` |

### Ghi chu AI API
- Customer personalization khong lay `userId` tu payload; backend suy ra owner qua JWT.
- `GET /api/costumes/recommendations` van giu de compatibility voi frontend cu, nhung logic ben duoi da di qua AI layer.
- LLM explanation la optional; khi provider loi thi response van co items va `fallbackUsed=true`.
