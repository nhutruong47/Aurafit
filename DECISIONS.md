# DECISIONS.md

## Các quyết định kỹ thuật đã xác nhận trong code

### Monorepo 2 app
- Backend và frontend nằm chung repo.
- Độ tin cậy: Cao

### PostgreSQL là relational store duy nhất trong repo
- Bằng chứng:
  - `docker-compose.yml`
  - `application-dev.yml`
  - `application-prod.yml`
- Độ tin cậy: Cao

### Auth dùng JWT access token + refresh token cookie
- Access token được trả trong response body.
- Refresh token được ghi vào HttpOnly cookie.
- `AuthResponseDTO.refreshToken` không serialize ra JSON.
- Độ tin cậy: Cao

### OTP registration đã được persist vào DB
- Bằng chứng:
  - `OtpVerification`
  - `OtpVerificationRepository`
  - `OtpService`
- Ghi chú:
  - Đây là thay đổi quan trọng so với một số doc/comment cũ nói là in-memory.
- Độ tin cậy: Cao

### `/api/users/register` là hybrid endpoint
- Email Gmail -> delegate sang OTP flow.
- Email non-Gmail -> tạo user trực tiếp.
- Frontend UI hiện tại không dùng endpoint này cho register.
- Độ tin cậy: Cao

### Costume và CostumeItem là 2 cấp domain khác nhau
- `Costume`: product catalog
- `CostumeItem`: đơn vị vật lý có SKU
- Độ tin cậy: Cao

### Có 2 lớp API catalog song song
- Public namespaced `/api/public/catalog/*`
- Compatibility `/api/costumes*`, `/api/categories`
- Độ tin cậy: Cao

### Recommendations endpoint hiện chưa phải AI
- Implementation hiện tại:
  - lấy active costumes
  - shuffle random
  - cắt theo `limit`
- Độ tin cậy: Cao

### Admin và staff API đã tồn tại ở backend
- Admin:
  - list/create/update costume
- Staff:
  - list/detail order
  - pickup handover
  - return handover
- Độ tin cậy: Cao

### Frontend đã nối thật nhiều flow hơn tài liệu cũ
- Đã nối:
  - auth
  - cart
  - checkout
  - payment
  - customer orders
  - admin costume
  - staff handover
- Độ tin cậy: Cao

## Các quyết định / ý nghĩa nghiệp vụ cần tiếp tục xác minh

### Đăng ký non-Gmail có phải là policy chính thức
- Code hiện tại cho phép qua `POST /api/users/register`.
- User được tạo trực tiếp và `emailVerified` không được set `true`.
- Trạng thái: Need verify in code

### `finalAmount` có phải là tổng khách phải trả
- `OrderResponse.finalAmount = totalRentalPrice - discountAmount`
- `Payment.amount = totalRentalPrice + totalDeposit - discountAmount`
- Trạng thái: Need verify in code

### Workflow staff có phải cần đổi `RentalOrder.status`
- Enum có `PICKED_UP`, `RETURNED`, `COMPLETED`
- Handover service hiện tại chưa thay đổi order status
- Trạng thái: Need verify in code

### Có nên giữ song song 2 bộ endpoint catalog
- Frontend đang dùng cả public namespaced và compatibility endpoints.
- Chưa thấy quyết định kiến trúc rõ trong repo.
- Trạng thái: Need verify in code

### Staff có nên được upload ảnh handover trực tiếp
- Frontend staff form có `ImageUploadField`.
- Backend upload endpoint hiện chỉ cho `ADMIN` và `CUSTOMER`.
- Trạng thái: Need verify in code

## Quyet dinh AI Recommendation MVP

### Khong train model rieng trong phase hien tai
- Recommendation duoc ghep tu:
  - product metadata
  - embedding similarity
  - inventory/rule filter
  - optional LLM explanation
- Do tin cay: Cao

### Embedding hien tai luu trong PostgreSQL dang text/JSON
- Chua bat `pgvector`.
- Similarity chay o application layer.
- Do tin cay: Cao

### External AI provider la optional
- Co env cho provider base URL, API key, embedding model, chat model.
- Neu khong co key hoac provider loi:
  - fallback local hash embedding
  - fallback deterministic reason
- Do tin cay: Cao

### Personalization customer dung SecurityContext
- Endpoint customer dung `/api/ai/recommendations/me`.
- `userId` chi duoc expose cho admin preview endpoint.
- Do tin cay: Cao

## Các nhận định không còn đúng trong tài liệu cũ
- "OTP chỉ lưu in-memory" -> Sai
- "Auth response body có refreshToken" -> Sai
- "application-dev.yml đang hard-code localhost:5432" -> Không còn đúng; datasource đã đọc từ env vars
- "Backend chưa có admin/staff API" -> Sai
- "Payment page đang hard-code demo order id" -> Không còn đúng
