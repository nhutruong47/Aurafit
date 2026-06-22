# DATABASE_CONTEXT.md

## Tổng quan
- Database là PostgreSQL.
- JPA auditing được bật qua `BaseEntity`.
- Chiến lược schema cho dev: `ddl-auto: update`
- Chiến lược schema cho prod: `ddl-auto: validate`
- Không tìm thấy migration tool. Cần xác minh xem schema có được quản lý bên ngoài repo hay không.

## Bảng / entity chính
| Entity | Field chính | Ghi chú |
| --- | --- | --- |
| `User` | `id`, `fullName`, `email`, `emailVerified`, `phone`, `phoneVerified`, `passwordHash`, `role`, `status` | Tên bảng được quote là `"User"` |
| `Category` | `id`, `name`, `description` | Quan hệ một-nhiều với `Costume` |
| `Costume` | `id`, `name`, `description`, `rentalPrice`, `depositPrice`, `imageUrl`, `status`, `category_id` | Sản phẩm cấp catalog |
| `CostumeItem` | `id`, `sku`, `size`, `color`, `status`, `costume_id` | Đơn vị tồn kho vật lý |
| `Cart` | `id`, `user_id`, `status`, `totalValue` | Hàm ý mỗi user có một active cart, nhưng chưa bị enforce bằng unique constraint |
| `CartItem` | `id`, `cart_id`, `costume_item_id`, `rentalStartDate`, `rentalEndDate`, `rentalDays`, `unitPrice`, `subtotal` | Không lưu quantity |
| `RentalOrder` | `id`, `user_id`, các field người nhận, rental window, totals, `status` | Entity checkout chính |
| `RentalOrderDetail` | `id`, `rental_order_id`, `costume_item_id`, pricing fields, `returnStatus` | Một dòng cho mỗi món đồ vật lý đã đặt |
| `Payment` | `id`, `rental_order_id`, `amount`, `method`, `status`, `transactionId` | Quan hệ một-một với order |
| `OtpEntry` | chỉ in-memory | Không phải bảng DB |

## Quan hệ
- `Category 1 -> many Costume`
- `Costume 1 -> many CostumeItem`
- `User 1 -> many Cart`
- `Cart 1 -> many CartItem`
- `CartItem many -> 1 CostumeItem`
- `User 1 -> many RentalOrder`
- `RentalOrder 1 -> many RentalOrderDetail`
- `RentalOrderDetail many -> 1 CostumeItem`
- `RentalOrder 1 -> 1 Payment`

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

## Field domain quan trọng

### Auth
- `User.email` là unique.
- `User.passwordHash` lưu mật khẩu đã mã hóa.
- `emailVerified` được set qua OTP flow cho luồng đăng ký Gmail.

### Cart
- `Cart.totalValue` được suy ra từ `CartItem.subtotal`.
- `CartItem` lưu rental window và price snapshot.

### Rental Order
- `RentalOrder.receiverName`
- `RentalOrder.receiverPhone`
- `RentalOrder.deliveryAddress`
- `RentalOrder.rentalStartDate`
- `RentalOrder.rentalEndDate`
- `RentalOrder.totalRentalPrice`
- `RentalOrder.totalDeposit`
- `RentalOrder.discountAmount`
- `RentalOrder.totalPrice`

### Payment
- `Payment.amount`
- `Payment.method`
- `Payment.status`
- `Payment.transactionId`

## Khu vực được yêu cầu nhưng không tìm thấy trong code
| Khu vực yêu cầu | Thực tế |
| --- | --- |
| `booking` | Gần nhất là `RentalOrder` |
| `appointment` | Không có |
| `rating` | Không có ở backend; UI review ở frontend chỉ là local |
| `upload` | Không có ở backend; ảnh staff ở frontend chỉ là local/base64 |

## Rủi ro schema / migration
- Không có lịch sử migration bằng Flyway/Liquibase.
- Dev dùng `ddl-auto: update`, dễ lệch với schema mong muốn.
- Test cần Postgres thật trên `localhost:5433`.
- OTP state không được persist; restart app sẽ mất OTP.
- `RentalOrderDetail` không lưu quantity rõ ràng dù checkout request có field này.
- Cần xác minh liệu bảng `"User"` có gây friction cho tooling hoặc script SQL bên ngoài hay không.
