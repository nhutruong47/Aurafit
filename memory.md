# Dự án AuraFit (SBA301) - Bộ nhớ quá trình làm việc

Tài liệu này lưu trữ tiến độ và các tính năng đã được hoàn thành trong quá trình phát triển dự án.

## Phase 1: Kiến trúc Lõi & Bảo mật (Core Architecture & Auth)
- **Khởi tạo Database Local:** Chạy PostgreSQL qua Docker, cấu hình kết nối Spring Boot (`dev` profile).
- **Thiết kế CSDL (Entities):** Ánh xạ 6 bảng chính (`Category`, `Costume`, `CostumeItem`, `RentalOrder`, `RentalOrderDetail`, `Payment`) với chế độ chặn lỗi N+1 Query (`FetchType.LAZY`).
- **Xử lý Lỗi Toàn cục:** Tạo cơ chế bắt lỗi tập trung (Global Exception Handler) chuẩn hóa JSON trả về cho các mã lỗi 400, 401, 403, 404, 500.
- **Chuẩn hóa API Đăng nhập:** Áp dụng chuẩn DTO để giấu Password, tách biệt logic HTTP ra khỏi Service.
- **Bảo mật Spring Security 6:** Chuyển đổi sang chuẩn mới (Lambda DSL), cấu hình CORS cho Frontend React, phân quyền Stateless API, và bảo vệ Refresh Token bằng HttpOnly Cookie.

## Phase 2: API Danh mục Sản phẩm (Catalog API)
- **Thiết kế DTO Response:** Tạo các bản ghi (`CategoryDTO`, `CostumeDTO`) và class `PaginatedResponse<T>` dùng chung cho mọi API cần phân trang sau này.
- **Tối ưu hóa Truy vấn (JPQL):** Dùng `JOIN FETCH` để tối ưu số lần gọi database (từ 21 queries xuống còn 1 query) khi tải danh sách sản phẩm.
- **Xây dựng API Catalog Công khai:**
  - `GET /api/public/catalog/categories`: Lấy danh sách thể loại cho Sidebar.
  - `GET /api/public/catalog/costumes`: Lấy danh sách trang phục có kèm **Phân trang** (Pagination) và **Lọc** (Tìm kiếm theo keyword, lọc theo Category ID).
  - `GET /api/public/catalog/costumes/{id}`: Xem chi tiết 1 trang phục.
- **Fix lỗi dữ liệu rỗng (PostgreSQL):** Sửa lỗi Postgres không đọc được keyword null bằng cách chuẩn hóa sang String rỗng (`""`).
- **Data Seeder:** Tạo class `DataInitializer` tự động khởi tạo dữ liệu mẫu (3 danh mục, 8 bộ trang phục kèm hình ảnh thật) mỗi khi chạy app. Đặc biệt, cập nhật data mẫu để chứa cả các mặt hàng vật lý (`CostumeItem`) với các SKU riêng biệt (Size S, M, L).

## Phase 3: Quản lý Giỏ hàng (Shopping Cart API) - Part 1
- **Domain Driven Design:** Tách biệt rõ ràng giữa `Costume` (Mẫu mã để hiển thị Catalog) và `CostumeItem` (Sản phẩm vật lý có mã SKU, Size, Màu sắc để tính tồn kho).
- **Thực thể Cart & CartItem:** Tạo mới bảng `carts` (Quản lý trạng thái `ACTIVE`, `CHECKED_OUT`, `ABANDONED`) và `cart_items` (Ghi nhận thời gian thuê và giá tiền). Thiết lập quan hệ với tính năng `orphanRemoval = true`.
- **Anti-IDOR Security:** Xây dựng `CartController` bảo mật nghiêm ngặt, tuyệt đối không nhận `userId` từ request body mà tự động bóc tách (extract) từ JWT Security Context (email của người đang đăng nhập).
- **Cart Service Logic:** Xử lý nghiệp vụ phức tạp của giỏ hàng bao gồm:
  - Tự động tạo giỏ hàng trống nếu user chưa có.
  - Validate tính hợp lệ của ngày thuê (`rentalEndDate > rentalStartDate`).
  - Kiểm tra trạng thái khả dụng (`AVAILABLE`) của món đồ vật lý (SKU).
  - Ngăn chặn việc thêm trùng lặp một mã vật lý (`SKU`) vào cùng một giỏ hàng.
  - Tự động tính toán số ngày thuê bằng `ChronoUnit.DAYS`, sau đó quy đổi ra `subtotal` và tổng giá trị giỏ hàng `totalCartValue`.
- **Tối ưu Database Queries:** Sử dụng Custom JPQL `JOIN FETCH` để fetch 3 cấp độ (`Cart` -> `CartItem` -> `CostumeItem` -> `Costume`) chỉ bằng 1 câu lệnh SQL duy nhất, dập tắt tận gốc lỗi N+1 Query khi ánh xạ sang đối tượng DTO trả về cho Frontend.
