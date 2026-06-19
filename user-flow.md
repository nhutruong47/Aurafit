# User Flow - Dự án AuraFit

Tài liệu này mô tả luồng thao tác của người dùng (User Flow) dựa trên các tính năng đã được thực hiện (Phase 1, Phase 2 và Phase 3 - Part 1).

## 1. Khách vãng lai (Guest) - Duyệt danh mục sản phẩm
* **Truy cập trang chủ/Danh mục:** Người dùng truy cập hệ thống và ngay lập tức có thể xem danh sách các danh mục (Categories) mà không cần đăng nhập.
  * *Hệ thống tự động gọi API:* `GET /api/public/catalog/categories`
* **Xem danh sách trang phục:** Người dùng chọn một danh mục, hoặc tìm kiếm trang phục bằng từ khóa. Hệ thống trả về danh sách sản phẩm phân trang (mỗi trang mặc định 12 sản phẩm).
  * *Hệ thống tự động gọi API:* `GET /api/public/catalog/costumes?categoryId={id}&keyword={kw}&pageNo=0&pageSize=12`
* **Xem chi tiết trang phục:** Người dùng bấm vào một bộ trang phục cụ thể để xem chi tiết mô tả, giá thuê trên ngày và các tùy chọn (size, màu sắc).
  * *Hệ thống tự động gọi API:* `GET /api/public/catalog/costumes/{id}`

## 2. Xác thực người dùng (Authentication)
Để thực hiện thao tác Thêm vào Giỏ hàng, hệ thống yêu cầu người dùng phải có tài khoản hợp lệ.
* **Đăng ký (Register):** Người dùng chưa có tài khoản điền form thông tin (email, mật khẩu, họ tên, số điện thoại). Hệ thống mã hóa mật khẩu và tạo tài khoản.
  * *Người dùng gọi API:* `POST /api/users/register` (hoặc `/api/auth/register`)
* **Đăng nhập (Login):** Người dùng nhập email và mật khẩu. Hệ thống xác thực và trả về JWT `accessToken` (để gửi kèm trong các request bảo mật) và lưu `refreshToken` vào HttpOnly Cookie (để tự động cấp lại token mới).
  * *Người dùng gọi API:* `POST /api/users/login` (hoặc `/api/auth/login`)
* **Yêu cầu bảo mật:** Từ bước này trở đi, mọi request cá nhân (ví dụ: Giỏ hàng) đều phải đính kèm header `Authorization: Bearer <accessToken>`.

## 3. Quản lý Giỏ hàng (Shopping Cart)
Khi đã có tài khoản và Token, người dùng bắt đầu tiến trình chọn đồ để thuê.
* **Thêm vào Giỏ hàng (Add to Cart):** Từ trang chi tiết sản phẩm, người dùng chọn mã sản phẩm vật lý cụ thể (VD: Size M, Màu Đen, SKU: AF-002-M-1), chọn ngày bắt đầu thuê (`rentalStartDate`) và ngày trả (`rentalEndDate`).
  * *Quy trình nội bộ của Server:* 
    - Xác minh danh tính người dùng ngầm qua JWT (chặn IDOR).
    - Tạo giỏ hàng trống `ACTIVE` nếu người dùng chưa có.
    - Kiểm tra logic kinh doanh: Ngày trả đồ phải sau ngày mượn đồ.
    - Kiểm tra trạng thái tồn kho: Sản phẩm vật lý đó phải đang ở trạng thái `AVAILABLE`.
    - Chặn trùng lặp: Nếu món đồ (SKU) đó đã có trong giỏ hàng thì báo lỗi.
    - Tính toán giá tiền: Tự động đếm số ngày thuê x Giá thuê ngày = Subtotal.
  * *Người dùng gọi API:* `POST /api/cart/add`
* **Xem Giỏ hàng (View Cart):** Người dùng mở trang Giỏ hàng. Hệ thống hiển thị toàn bộ danh sách các mặt hàng đang chọn, thông tin chi tiết từng món đồ (tên, hình ảnh, size, ngày thuê) và **tổng tiền thanh toán** (`totalCartValue`).
  * *Hệ thống tự động gọi API:* `GET /api/cart`
* **Xóa khỏi Giỏ hàng (Remove Item):** Nếu đổi ý, người dùng bấm nút xóa (X) một món đồ khỏi giỏ hàng. Hệ thống tự động xóa món đồ đó và cập nhật lại tổng tiền.
  * *Người dùng gọi API:* `DELETE /api/cart/remove/{cartItemId}`

---
*Tài liệu này sẽ liên tục được cập nhật theo tiến trình phát triển của các Phase tiếp theo (Thanh toán, Quản lý Đơn hàng, v.v.).*
