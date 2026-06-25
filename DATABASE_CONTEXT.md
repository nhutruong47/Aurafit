# DATABASE_CONTEXT.md

## Tổng quan
- Database chính: PostgreSQL
- JPA auditing bật qua `BaseEntity`
- Dev:
  - `ddl-auto: update`
  - `spring.profiles.active=dev` mặc định
- Prod:
  - `ddl-auto: validate`
- Chưa thấy Flyway / Liquibase

## Local infra và cấu hình hiện tại
- `docker-compose.yml`:
  - Postgres container nghe `5432`
  - host map `5433:5432`
- `application-dev.yml`:
  - datasource đọc từ `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `backend/.env.example`:
  - `DATABASE_URL=jdbc:postgresql://<host>:5432/postgres`
- Nghĩa là sample env mặc định vẫn để `5432`, trong khi Docker compose local expose `5433`.

## Entity / bảng chính
| Entity | Bảng | Ghi chú |
| --- | --- | --- |
| `User` | `"User"` | Bảng bị quote, role/status theo enum |
| `Category` | `categories` | Danh mục costume |
| `Costume` | `costumes` | Product cấp catalog |
| `CostumeItem` | `costume_items` | Đơn vị vật lý có SKU |
| `Cart` | `carts` | Cart theo user |
| `CartItem` | `cart_items` | Snapshot rental window + pricing |
| `RentalOrder` | `rental_orders` | Đơn thuê |
| `RentalOrderDetail` | `rental_order_details` | Mỗi dòng map vào 1 `CostumeItem` |
| `Payment` | `payments` | One-to-one với order |
| `OtpVerification` | `otp_verifications` | Lưu OTP + registration payload |
| `UploadAsset` | `upload_assets` | Metadata file upload |
| `HandoverRecord` | `handover_records` | Biên bản pickup / return |

## Quan hệ chính
- `Category 1 -> many Costume`
- `Costume 1 -> many CostumeItem`
- `User 1 -> many Cart`
- `Cart 1 -> many CartItem`
- `CartItem many -> 1 CostumeItem`
- `User 1 -> many RentalOrder`
- `RentalOrder 1 -> many RentalOrderDetail`
- `RentalOrderDetail many -> 1 CostumeItem`
- `RentalOrder 1 -> 1 Payment`
- `User 1 -> many UploadAsset`
- `RentalOrderDetail 1 -> many HandoverRecord`
- `User (staff/admin) 1 -> many HandoverRecord`

## Field domain quan trọng

### User
- `email` unique
- `passwordHash` lưu mật khẩu đã hash
- `emailVerified`:
  - `true` sau OTP register thành công
  - direct register non-Gmail hiện không set field này thành `true`
- `role` mặc định `CUSTOMER`
- `status` mặc định `ACTIVE`

### Costume / inventory
- `Costume` giữ thông tin product:
  - `name`
  - `description`
  - `rentalPrice`
  - `depositPrice`
  - `imageUrl`
  - `status`
- `CostumeItem` giữ:
  - `sku`
  - `size`
  - `color`
  - `status`

### Cart
- `Cart.totalValue` được recalculate từ `CartItem.subtotal`
- `CartItem` lưu:
  - `rentalStartDate`
  - `rentalEndDate`
  - `rentalDays`
  - `unitPrice`
  - `subtotal`

### Rental order
- `RentalOrder` lưu:
  - thông tin người nhận
  - rental window tổng
  - `totalRentalPrice`
  - `totalDeposit`
  - `discountAmount`
  - `totalPrice`
  - `status`
- `RentalOrder.totalPrice` hiện được set bằng rental subtotal lúc checkout, không cộng deposit.
- `RentalOrderDetail` lưu:
  - `pricePerDay`
  - `rentalDays`
  - `subtotal`
  - `deposit`
  - `price`
  - `returnStatus`

### OTP
- `OtpVerification` không chỉ lưu OTP:
  - `email`
  - `otpCode`
  - `expiresAt`
  - `fullName`
  - `phone`
  - `passwordHash`
- Có unique index trên `email`.

### Handover
- `HandoverRecord` lưu:
  - `handoverType`
  - `returnStatus`
  - `imageUrl`
  - `note`
  - `staffUser`
  - `rentalOrderDetail`

## Enum quan trọng
| Enum | Giá trị |
| --- | --- |
| `Role` | `CUSTOMER`, `STAFF`, `ADMIN` |
| `UserStatus` | `ACTIVE`, `BLOCKED` |
| `CartStatus` | `ACTIVE`, `CHECKED_OUT`, `ABANDONED` |
| `CostumeStatus` | `ACTIVE`, `INACTIVE`, `DISCONTINUED` |
| `ItemStatus` | `AVAILABLE`, `RENTED`, `MAINTENANCE`, `LOST` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `CANCELLED`, `PICKED_UP`, `RETURNED`, `COMPLETED` |
| `ReturnStatus` | `NOT_RETURNED`, `RETURNED`, `DAMAGED`, `LOST` |
| `PaymentMethod` | `CASH`, `BANKING`, `MOMO`, `VN_PAY` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `HandoverType` | `PICKUP`, `RETURN` |

## Seed data
- `DataInitializer` chỉ chạy dưới profile `dev`
- Tạo:
  - 3 categories
  - 8 costumes
  - 2 `CostumeItem` / costume
  - tổng cộng 16 `CostumeItem`

## Rủi ro schema / data model
- Không có migration history.
- Bảng `"User"` có thể gây bất tiện cho tooling / SQL script.
- Không thấy DB constraint đảm bảo mỗi user chỉ có 1 active cart.
- `CheckoutItemRequest.quantity` tồn tại, nhưng `RentalOrderDetail` vẫn map vào 1 `CostumeItem` vật lý.
- Handover flow cập nhật `RentalOrderDetail.returnStatus`, nhưng order-level status machine chưa được enforce đầy đủ trong service.

## AI Recommendation MVP schema
| Entity | Bang | Ghi chu |
| --- | --- | --- |
| `ProductAiMetadata` | `product_ai_metadata` | Metadata AI theo `costume_id`, luu tags + searchable text |
| `ProductEmbedding` | `product_embeddings` | Embedding cua costume, hien dang luu vector o `embedding_payload` dang text/JSON |
| `UserBehaviorEvent` | `user_behavior_events` | Event view/search/filter/cart/order/recommendation click |
| `UserPreferenceProfile` | `user_preference_profiles` | Profile tong hop tu behavior va rental history |
| `FashionTrend` | `fashion_trends` | Trend do admin nhap tay hoac sync sau nay |

## Ghi chu AI database
- Hien tai chua dung `pgvector`.
- Retrieval MVP dung `embedding_payload` + cosine similarity o application layer.
- `product_ai_metadata`, `product_embeddings`, `user_preference_profiles` deu co unique relation theo owner key:
  - `costume_id`
  - `costume_id`
  - `user_id`
