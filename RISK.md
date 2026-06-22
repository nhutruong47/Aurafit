# RISK.md

## Backend
| Rủi ro | Mức độ | File/module liên quan | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Credential Gmail SMTP của môi trường dev đang được commit trong repo | Cao | `backend/src/main/resources/application-dev.yml` | Chuyển sang env vars hoặc secret manager ngay |
| Cart service ném `IllegalArgumentException` / `IllegalStateException`, có khả năng nổi lên thành `500` thay vì `4xx` có kiểm soát | Cao | `backend/src/main/java/com/aurafit/service/impl/CartServiceImpl.java`, `GlobalExceptionHandler.java` | Thay bằng custom exception và handler rõ ràng |
| Checkout request hỗ trợ `quantity`, nhưng data model/order detail chỉ biểu diễn một SKU vật lý | Cao | `CheckoutServiceImpl.java`, `CheckoutItemRequest.java`, `RentalOrderDetail.java` | Hoặc bỏ `quantity`, hoặc thiết kế lại inventory model |
| Ngữ nghĩa amount giữa payment/order không nhất quán: payment gồm tiền cọc, còn `OrderResponse.finalAmount` thì không | Cao | `PaymentServiceImpl.java`, `OrderResponse.java` | Đổi tên/thêm field để phân biệt payable total với rental subtotal |
| Test cần Postgres thật ở cổng `5433`, làm `mvn test` thất bại trong môi trường sạch | Trung bình | `AuraFitApplicationTests.java`, `application-dev.yml` | Thêm test profile với DB cô lập hoặc mock |
| Endpoint refresh chỉ validate expiry/username mà không check `tokenType == REFRESH` | Trung bình | `JwtTokenProvider.java`, `UserServiceImpl.java` | Enforce token type khi refresh |
| OTP cache chỉ lưu in-memory; restart hoặc multi-instance sẽ làm hỏng xác thực | Trung bình | `OtpService.java` | Chuyển state OTP sang kho dùng chung/persistent |
| Xử lý webhook chưa thể hiện rõ tính idempotent cho callback SePay lặp lại | Trung bình | `PaymentServiceImpl.java` | Làm cho callback lặp lại vẫn an toàn và quan sát được |

## Frontend
| Rủi ro | Mức độ | File/module liên quan | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Path và payload trong service layer chưa khớp hoàn toàn với backend | Cao | `frontend/src/services/` | Viết lại service layer theo `API_CONTEXT.md` |
| Xử lý auth response sai vì frontend kỳ vọng raw user object, trong khi backend trả wrapper có `data.user` | Cao | `frontend/src/pages/Account.jsx`, `frontend/src/services/`, `frontend/src/utils/roles.js` | Normalize backend response trong API layer trước khi lưu |
| Product mapping kỳ vọng `category` là string, nhưng backend có thể trả category object | Cao | `frontend/src/utils/productMapper.js` | Map từ `costume.category.name` |
| Cart hiện là local-only, bỏ qua flow cart/order thật ở backend | Cao | `cartSlice.js`, `Checkout.jsx`, `App.jsx` | Quyết định source of truth và tích hợp API cart backend |
| Payment page dùng demo order id hard-code và payload thanh toán chưa khớp | Cao | `frontend/src/pages/Payment.jsx` | Thay bằng luồng tạo order thật + payment init thật |
| Orders page đang tải staff endpoint cho lịch sử của customer | Cao | `frontend/src/hooks/useUserOrders.js` | Chuyển sang `GET /api/orders` và detail API |
| Dashboard staff/admin phụ thuộc vào các API chưa tồn tại | Cao | `useStaffOrders.js`, `useAdminProducts.js` | Hoặc triển khai API backend, hoặc đánh dấu rõ là mock |
| Một số màn hình còn phụ thuộc dữ liệu giả/local state nên deep-link và backend integration chưa hoàn chỉnh | Trung bình | nhiều page/hook frontend | Chuẩn hóa lại theo route thật + API thật |

## Database
| Rủi ro | Mức độ | File/module liên quan | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Không tìm thấy migration tool; dev đang dùng `ddl-auto: update` | Cao | `application-dev.yml`, toàn bộ schema | Thêm Flyway/Liquibase |
| Tên bảng `"User"` được quote có thể gây khó khăn cho SQL portability | Trung bình | `entity/User.java` | Cân nhắc đổi tên bảng khi đã có migration |
| Không thấy constraint rõ ràng cho việc một user chỉ có một active cart | Trung bình | `Cart.java`, DB schema | Thêm uniqueness ở mức DB nếu cần |

## Business Logic
| Rủi ro | Mức độ | File/module liên quan | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Codebase hiện tại là cho thuê trang phục, nhưng các thuật ngữ `patient/doctor` không khớp domain | Trung bình | toàn bộ repo | Xác nhận lại domain/giả định dự án trước các prompt sau |
| Đăng ký trực tiếp không phải Gmail đang bỏ qua OTP verification | Trung bình | `UserController.java`, `AuthService.java`, `UserServiceImpl.java` | Xác nhận business rule và thống nhất chính sách đăng ký |
| Một số tài liệu cũ nhắc tới AI, timeline, staff workflow chưa có ở backend | Trung bình | `memory.md`, `user-flow.md` cũ | Giữ tài liệu bám sát code, gắn nhãn phần tương lai cho rõ |

## Security
| Rủi ro | Mức độ | File/module liên quan | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Secret đang bị commit trong repo | Cao | `application-dev.yml`, `application.yml` | Rotate secret và loại khỏi source control |
| Chưa có rate limiting / anti-abuse cho OTP hoặc login | Trung bình | auth controller/service | Thêm throttling và audit logging |
| CORS dev bị hard-code cho một origin; policy production chưa được tài liệu hóa | Thấp | `SecurityConfig.java` | Externalize danh sách allowed origins |

## UX
| Rủi ro | Mức độ | File/module liên quan | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Nhiều màn hình được làm đẹp nhưng vẫn mang tính mock, dễ khiến stakeholder hiểu nhầm là flow đã hoàn chỉnh | Cao | nhiều page frontend | Gắn nhãn mock rõ ràng cho tới khi tích hợp xong |
| Nội dung trộn tiếng Việt/tiếng Anh và status label chưa nhất quán | Trung bình | page/component frontend | Chuẩn hóa nội dung và dictionary status |
