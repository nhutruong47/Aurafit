# AGENTS.md

## Mục đích
- Dự án này là `AuraFit`, một nền tảng cho thuê trang phục với:
  - `backend/`: API Spring Boot
  - `frontend/`: ứng dụng React/Vite
- Các AI agent phải ưu tiên tính chính xác hơn tốc độ. Hãy đọc mã nguồn và các file context trước khi thay đổi hành vi.

## Thứ tự đọc trước khi chỉnh sửa
1. `PROJECT_CONTEXT.md`
2. `ARCHITECTURE.md`
3. Context module liên quan:
   - `BACKEND_CONTEXT.md`
   - `FRONTEND_CONTEXT.md`
   - `API_CONTEXT.md`
   - `DATABASE_CONTEXT.md`
4. `USER_FLOW.md`
5. `RISK.md`
6. `DECISIONS.md`
7. `TODO_CONTEXT.md`

## Quy tắc chung
- Không thay đổi hành vi nghiệp vụ trừ khi tác vụ yêu cầu rõ ràng.
- Không tự suy diễn thêm quy tắc nghiệp vụ không có trong mã nguồn.
- Nếu không chắc chắn, hãy ghi `Need verify in code` trong tài liệu hoặc hỏi xác nhận trước khi đổi logic.
- Không hard-code dữ liệu production giả, ID giả, status giả, payload API giả, hoặc giả định auth không có thật.
- Không đưa thêm secret vào code. Repo hiện tại đã có rủi ro lộ secret, không làm tình hình tệ hơn.
- Ưu tiên thay đổi nhỏ, dễ review hơn là viết lại diện rộng.

## Quy ước backend
- Giữ tách biệt controller/service/repository/entity.
- Controller chỉ nên xử lý concern HTTP; service phải nắm logic nghiệp vụ.
- Không expose entity trực tiếp nếu DTO đã tồn tại.
- Dùng `jakarta.validation` cho request DTO.
- Dùng enum làm nguồn chân lý cho status và role.
- Dùng `BigDecimal` cho tiền tệ.
- Lấy người dùng đã xác thực từ Spring Security context; không tin `userId` từ request payload khi liên quan đến ownership.
- Giữ nguyên contract lỗi hiện tại:
  - các endpoint auth/user có success wrapper qua `ApiResponse<T>`
  - nhiều endpoint khác trả DTO trực tiếp
  - shape lỗi là `ErrorResponse`
- Khi thêm hoặc sửa API:
  - kiểm tra shape DTO
  - kiểm tra enum và chuyển trạng thái
  - kiểm tra lệch contract frontend trước
  - cập nhật endpoint vào `API_CONTEXT.md`

## Quy ước frontend
- Frontend hiện tại sử dụng:
  - Redux Toolkit cho lưu auth/cart
  - React Router cho điều hướng theo URL
  - các service theo domain trong `src/services/`
- Ưu tiên functional component và hooks.
- Giữ data fetching trong hooks/services, không nhét sâu vào component trình bày.
- Tái sử dụng UI component sẵn có trước khi thêm component mới.
- Khi refactor page lớn, tách theo section thay vì viết lại toàn bộ.
- Không thêm thêm mock flow nếu backend contract đã tồn tại; hãy bám vào API thật.

## Trước khi thay đổi code
- Đọc flow liên quan trong `USER_FLOW.md`.
- Kiểm tra request/response DTO và giá trị enum ở backend.
- Kiểm tra code mapping ở frontend trong `frontend/src/services/` và `frontend/src/utils/productMapper.js`.
- Xác minh kiểu dữ liệu/shape ở các ranh giới tích hợp.
- Chạy bước xác minh nhỏ nhất có ý nghĩa:
  - Frontend: `npm exec vite build`
  - Infra: `docker compose up -d`
  - Backend tests: `.\\mvnw.cmd test`

## Quy tắc API / DTO / Enum / Error Handling
- Không tùy tiện đổi tên field API; frontend/backend đã có lệch contract.
- Không thêm status string mới nằm ngoài enum backend.
- Nếu thêm status mới, phải cập nhật:
  - enum
  - logic chuyển trạng thái trong service
  - mapping DTO/response
  - phần hiển thị status ở frontend
  - tài liệu/context liên quan
- Ưu tiên custom exception hơn `IllegalArgumentException` / `IllegalStateException` cho validation hướng API.

## Quy tắc refactor
- Giữ nguyên hành vi cũ trừ khi tác vụ yêu cầu đổi hành vi.
- Tách nhỏ page/component/service lớn theo từng bước.
- Giữ compatibility ngược cho contract persistence và transport nếu có thể.
- Chạy lại build/test mục tiêu sau khi refactor.

## Khu vực rủi ro cao hiện tại
- Tầng API frontend chưa khớp hoàn toàn với path/payload backend.
- Credential môi trường dev đang được commit trong cấu hình backend.
- Các flow staff/admin có ở UX frontend nhưng backend còn thiếu hoặc chưa hoàn chỉnh.
- Contract checkout/payment cần xác minh rất cẩn thận trước khi chỉnh sửa.
