# RISK.md

## Backend
| Rủi ro | Mức độ | File / module | Ghi chú |
| --- | --- | --- | --- |
| Sample env và Docker compose đang lệch cổng Postgres | Cao | `backend/.env.example`, `docker-compose.yml` | Local setup dễ nhầm `5432` vs `5433` |
| `CartServiceImpl` vẫn ném `IllegalArgumentException` / `IllegalStateException` | Cao | `CartServiceImpl.java` | Có thể bị đẩy lên 500 thay vì 4xx có kiểm soát |
| `CheckoutItemRequest.quantity` lệch với inventory model `CostumeItem` vật lý | Cao | `CheckoutItemRequest.java`, `CheckoutServiceImpl.java`, `RentalOrderDetail.java` | Totals có thể nhân theo quantity nhưng inventory/detail chưa đối xứng |
| Nghĩa amount giữa order response, `totalPrice`, và payment chưa nhất quán | Cao | `OrderResponse.java`, `RentalOrder.java`, `PaymentServiceImpl.java` | Liên quan `totalDeposit` và tổng thanh toán thật |
| Upload role đang lệch với staff UI | Cao | `UploadController.java`, `StaffDashboardPage.jsx` | Staff có uploader trên UI nhưng API chỉ cho `ADMIN/CUSTOMER` |
| `PaymentServiceImpl` hard-code bank account VietQR | Trung bình | `PaymentServiceImpl.java` | Nên externalize |
| Refresh flow chưa check rõ `tokenType == REFRESH` | Trung bình | `JwtTokenProvider.java`, `UserServiceImpl.java` | Validation hiện tại chưa chặt |
| Webhook SePay chưa thể hiện rõ idempotency | Trung bình | `PaymentServiceImpl.java` | Callback lặp lại sau khi PAID sẽ trả lỗi |
| Staff handover chưa đầy đủ state transition order-level | Trung bình | `StaffServiceImpl.java` | Có enum nhưng service chưa dùng hết |
| Comment trong `AuthController` vẫn mô tả OTP in-memory | Thấp | `AuthController.java` | Dễ gây nhầm cho refactor sau |

## Frontend
| Rủi ro | Mức độ | File / module | Ghi chú |
| --- | --- | --- | --- |
| Checkout summary và voucher đang tính bằng UI hard-code | Cao | `frontend/src/pages/RentalOrderCheckoutPage.jsx` | Dễ lệch với pricing backend |
| Cart source of truth chưa rõ ràng vì còn local fallback | Cao | `App.jsx`, `cartSlice.js`, `RentalOrderCheckoutPage.jsx` | Cần chốt backend-first hay hybrid |
| `rentalOrderService.fetchOrderTimeline()` gọi endpoint không tồn tại | Trung bình | `frontend/src/services/rentalOrderService.js` | Đang là helper mở, backend chưa có |
| `interactionsService` gọi endpoint không tồn tại | Trung bình | `frontend/src/services/interactionsService.js` | Hiện đang swallow error |
| Chat page chưa có backend | Trung bình | `frontend/src/pages/ChatPage.jsx` | Dễ stakeholder hiểu nhầm |
| Product reviews chỉ tồn tại ở frontend | Trung bình | `ProductReviewsSection.jsx` | Không có persistence / API |
| Admin overview/support/reports dùng data hard-code | Trung bình | `AdminDashboardPage.jsx` | Product tab đã là data thật, các tab kia thì không |
| Frontend register UI chưa expose direct register non-Gmail | Trung bình | `AccountAuthForm.jsx` | Lệch với khả năng backend |

## Database / Infra
| Rủi ro | Mức độ | File / module | Ghi chú |
| --- | --- | --- | --- |
| Không có migration tool | Cao | Toàn bộ persistence | Dễ drift schema |
| Bảng `"User"` bị quote | Trung bình | `User.java` | Có thể gây friction cho tooling |
| Không thấy constraint đảm bảo 1 active cart / user | Trung bình | `Cart.java`, schema | Business invariant chưa được DB enforce |
| `.\\mvnw.cmd test` dùng `@SpringBootTest` và chưa có test profile riêng | Trung bình | `AuraFitApplicationTests.java` | Dễ phụ thuộc config runtime |
| Secret hygiene phụ thuộc env vars / local `.env` | Trung bình | `application*.yml`, sample env files | Code đã bỏ hard-code yml, nhưng vẫn cần kiểm soát chặt env local |

## AI Recommendation MVP
| Rủi ro | Mức độ | File / module | Ghi chú |
| --- | --- | --- | --- |
| Khong co migration tool cho cac bang AI moi | Cao | AI entities + dev schema | De drift schema giua moi truong |
| Embedding hien tai chua dung `pgvector` | Trung bình | `product_embeddings`, AI recommendation service | Catalog lon se bi scan app-layer cham |
| LLM explanation phu thuoc external provider | Trung bình | `AiProviderClient` | Da co fallback, nhung quality reason se giam khi fallback |
| Trend va metadata phu thuoc admin nhap tay | Trung bình | admin AI forms | Neu admin nhap khong chat, recommendation quality se giam |
| Chua co wishlist domain yet | Thấp | AI behavior model | Phase 1 chua dung tin hieu nay |

## Tài liệu / Context
| Rủi ro | Mức độ | File / module | Ghi chú |
| --- | --- | --- | --- |
| Nhiều file markdown cũ mô tả sai auth response, register flow, env config, và upload auth | Cao | root `.md` files, `frontend/README.md` | Đã được căn chỉnh lại trong đợt audit này |
| Một số comment trong code vẫn nói OTP là in-memory | Thấp | `AuthController.java` | Khác với implementation thật |
