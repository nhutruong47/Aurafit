# ARCHITECTURE.md

## Kiến trúc tổng thể
- Repo hiện tại là monorepo 2 ứng dụng:
  - `backend/`: Spring Boot REST API
  - `frontend/`: React SPA
- Infra local trong repo chỉ gồm:
  - PostgreSQL
  - pgAdmin
- Không thấy Redis, message broker, object storage self-hosted, hay migration tool.

## Kiến trúc backend
- Backend theo layered architecture:
  - `controller/`: HTTP endpoint
  - `service/` + `service/impl/`: business logic
  - `repository/`: JPA query
  - `entity/`: persistence model
  - `dto/request`, `dto/response`: API contract
  - `security/`: JWT auth
  - `config/`: security, OpenAPI, seed data, Cloudinary
  - `exception/`: error handling
- Business modules hiện có:
  - auth / OTP
  - catalog
  - cart
  - checkout / orders
  - payment
  - upload
  - admin costume
  - staff handover
- JPA auditing được bật qua `BaseEntity`.
- Nhiều repository dùng `JOIN FETCH` để map DTO an toàn khi `open-in-view=false`.

## Kiến trúc frontend
- Frontend là React SPA dùng `react-router-dom` cho URL routing.
- State management:
  - Redux Toolkit cho `auth` và `cart`
  - Zustand cho state nhỏ của payment / checkout (`pendingOrderId`)
- Service layer tách theo domain:
  - `authService`
  - `catalogService`
  - `costumeService`
  - `cartService`
  - `rentalOrderService`
  - `paymentService`
  - `uploadService`
  - `interactionsService`
- Hooks page-level hiện có:
  - `useCatalogCostumes`
  - `useCatalogFilters`
  - `useShopCostumes`
  - `useRentalOrders`
  - `useStaffRentalOrders`
  - `useAdminCostumes`

## Biên giới tích hợp FE/BE
| Khu vực | Trạng thái |
| --- | --- |
| Auth | FE/BE đã nối thật, có unwrap `ApiResponse` |
| Cart | Hybrid: ưu tiên backend, local fallback nếu item thiếu dữ liệu backend |
| Checkout | Đã tạo order thật |
| Payment | Đã init payment thật, chưa có polling / verify sau webhook |
| Orders | Customer và staff detail đã nối thật |
| Admin products | Đã nối thật cho list/create/update |
| Upload | Đã nối thật cho admin; staff UI có uploader nhưng role backend đang lệch |
| Chat / AI interactions | Chưa có backend |
| Reviews | Chưa có backend |

## Kiến trúc API catalog
- Hiện tồn tại 2 lớp endpoint cùng trỏ vào `CostumeService`:
  - Public namespaced:
    - `/api/public/catalog/categories`
    - `/api/public/catalog/costumes`
    - `/api/public/catalog/costumes/{id}`
  - Compatibility / convenience:
    - `/api/categories`
    - `/api/costumes`
    - `/api/costumes/{id}`
    - `/api/costumes/seasonal`
    - `/api/costumes/recommendations`
- Frontend đang dùng cả 2 lớp này:
  - `catalogService` dùng public namespaced endpoints
  - `useCatalogCostumes` và `useShopCostumes` vẫn dùng compatibility endpoints

## Database và infra
- `docker-compose.yml` map host `5433` -> container `5432`.
- `backend/src/main/resources/application-dev.yml` không hard-code host/port nữa; datasource đọc từ env vars.
- `backend/.env.example` vẫn để mẫu `DATABASE_URL=jdbc:postgresql://<host>:5432/postgres`, nên sample setup local vẫn lệch với Docker compose mặc định.
- Dev profile dùng `ddl-auto: update`.
- Prod profile dùng `ddl-auto: validate`.

## Đặc điểm kiến trúc quan trọng
- Auth:
  - access token trong response body
  - refresh token trong HttpOnly cookie
  - `AuthResponseDTO.refreshToken` bị `@JsonIgnore`
  - frontend request client dùng `withCredentials: true`
- OTP:
  - persist trong bảng `otp_verifications`
  - không phải in-memory cache nữa
- Upload:
  - backend upload signed lên Cloudinary
  - lưu metadata vào `upload_assets`
  - role guard hiện tại là `ADMIN` / `CUSTOMER`
- Payment:
  - webhook SePay là public endpoint có header token
  - thông tin tài khoản VietQR đang hard-code trong `PaymentServiceImpl`

## Khoảng trống kiến trúc hiện tại
- Chưa có migration tool (`Flyway` / `Liquibase`).
- Chưa có dedicated test profile cho backend.
- Chưa có backend cho chat, review, interaction tracking, order timeline.
- Staff handover đã có API nhưng chưa thấy workflow order-state đầy đủ.

## AI Recommendation MVP architecture
- Backend bo sung AI sub-system tren cung layered architecture hien co:
  - `AdminAiController`, `AiTrackingController`, `AiRecommendationController`
  - `AiAdminServiceImpl`, `BehaviorTrackingServiceImpl`, `AiRecommendationServiceImpl`, `UserPreferenceProfileServiceImpl`
  - persistence moi cho metadata, embedding, behavior event, profile, trend
- Embedding hien tai duoc luu trong PostgreSQL o `product_embeddings.embedding_payload` dang JSON/text.
- Retrieval MVP chay o application layer:
  - query embedding
  - cosine similarity
  - rule filter inventory/size/budget/gender
  - optional LLM explanation
- Neu external AI provider loi hoac chua co key:
  - backend fallback sang local hash embedding
  - recommendation van tra ve qua rule-based reason
