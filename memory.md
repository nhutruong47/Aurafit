# Dự án AuraFit (SBA301) - Ghi nhớ quá trình phát triển

Tài liệu này lưu lại tiến độ và các hạng mục lớn đã được triển khai trong dự án.

## Phase 1: Kiến trúc lõi và bảo mật
- Khởi tạo database local bằng PostgreSQL qua Docker và cấu hình kết nối Spring Boot cho profile `dev`.
- Thiết kế entity chính cho domain thuê trang phục: `Category`, `Costume`, `CostumeItem`, `RentalOrder`, `RentalOrderDetail`, `Payment`.
- Thiết lập global exception handler để chuẩn hóa JSON lỗi cho các mã 400, 401, 403, 404, 500.
- Chuẩn hóa API đăng nhập bằng DTO, tách logic HTTP ra khỏi service.
- Cấu hình Spring Security 6 theo hướng stateless API, hỗ trợ CORS cho frontend React, và bảo vệ refresh token bằng HttpOnly cookie.

## Phase 2: Catalog API
- Tạo các DTO như `CategoryDTO`, `CostumeDTO`, và `PaginatedResponse<T>`.
- Tối ưu truy vấn bằng `JOIN FETCH` để giảm N+1 query.
- Xây dựng API catalog công khai:
  - `GET /api/public/catalog/categories`
  - `GET /api/public/catalog/costumes`
  - `GET /api/public/catalog/costumes/{id}`
- Sửa lỗi liên quan tới keyword null trên PostgreSQL.
- Tạo `DataInitializer` để seed dữ liệu mẫu, bao gồm cả `CostumeItem` có SKU riêng cho các size khác nhau.

## Phase 3: Shopping Cart API
- Tách rõ `Costume` là sản phẩm hiển thị ở catalog và `CostumeItem` là đơn vị vật lý có tồn kho.
- Tạo entity `Cart` và `CartItem`, quản lý trạng thái như `ACTIVE`, `CHECKED_OUT`, `ABANDONED`.
- Bảo vệ cart flow khỏi IDOR bằng cách lấy user từ JWT Security Context thay vì nhận từ request body.
- Triển khai logic cart:
  - tự tạo giỏ hàng trống nếu chưa có
  - validate ngày thuê/ngày trả
  - kiểm tra item có đang `AVAILABLE`
  - chặn thêm trùng cùng một món đồ vật lý
  - tính `subtotal` và `totalCartValue`
- Tối ưu truy vấn cart bằng custom JPQL `JOIN FETCH`.

## Phase 3 - Phần mở rộng đã được lên kế hoạch
Các hướng phát triển tiếp theo đã được xác định nhưng chưa hoàn thiện toàn bộ:
- checkout dùng một flow thống nhất
- thanh toán tự động qua VietQR + SePay webhook
- AI behavior tracking
- AI recommendation
- AI chat assistant
- order tracking chi tiết
- account management đầy đủ hơn

## Ghi chú hiện trạng
- Backend lõi cho auth/catalog/cart/checkout/payment đã có nền tảng.
- Frontend đã có giao diện tương đối đầy đủ, nhưng nhiều phần vẫn chưa nối chuẩn với backend.
- Tài liệu context hiện được dùng như nguồn tham chiếu cho các lần refactor và tích hợp tiếp theo.

## Phase 4: Upload service cho hình ảnh
- Thêm upload module riêng ở backend để nhận `multipart/form-data`, validate ảnh và upload signed lên Cloudinary.
- Thêm entity `UploadAsset` để lưu metadata ảnh đã upload:
  - `originalFileName`
  - `url`
  - `secureUrl`
  - `publicId`
  - `resourceType`
  - `format`
  - `size`
  - `uploadedBy`
- Endpoint mới:
  - `POST /api/uploads/images`
- Quyền hiện tại:
  - chỉ user đã đăng nhập có role `ADMIN` hoặc `CUSTOMER`
- Tích hợp frontend giai đoạn đầu:
  - admin upload ảnh cho `Costume`
  - giá trị `secureUrl` được gán vào `Costume.imageUrl`
- Phần rating/review có nhu cầu dùng lại upload service này trong tương lai, nhưng module review backend chưa tồn tại nên chưa tích hợp ở phase này.
