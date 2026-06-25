# FRONTEND_CONTEXT.md

## Tổng quan frontend
- Stack:
  - React 19
  - Vite 8
  - Tailwind CSS 3
  - React Router 7
  - Redux Toolkit
  - Zustand
  - Axios
- Base API mặc định:
  - `VITE_API_BASE_URL=http://localhost:8080/api`

## Cấu trúc thư mục chính
| Đường dẫn | Vai trò |
| --- | --- |
| `src/App.jsx` | route tree và orchestration tổng |
| `src/pages/` | page-level screens |
| `src/components/` | UI sections / shared components |
| `src/hooks/` | hook data + page orchestration |
| `src/services/` | API layer theo domain |
| `src/store/` | Redux slices, browser storage, zustand store |
| `src/utils/` | product mapping, role helper, currency |
| `src/routing/` | mapping page key -> route |

## Routes thực tế
- Main routes:
  - `/`
  - `/catalog`
  - `/shop`
  - `/products/:productId`
  - `/checkout`
  - `/orders`
  - `/account`
- Operational / secondary routes:
  - `/payment`
  - `/success`
  - `/admin`
  - `/staff`
  - `/chat`
  - `/yearbook`
  - `/cosplay`
  - `/events`
  - `/care`

## State management
| Khu vực | Cách lưu |
| --- | --- |
| Auth | Redux `authSlice`, persist localStorage key `aurafitCurrentUser` |
| Cart | Redux `cartSlice`, persist localStorage key `aurafitCartItems` |
| Pending payment order | Zustand `useCheckoutStore`, persist key `aurafitPendingOrderId` |

## Services đang tồn tại
| Service | Trạng thái |
| --- | --- |
| `authService.js` | Đã dùng thật |
| `catalogService.js` | Đã dùng thật cho `/api/public/catalog/*` |
| `costumeService.js` | Đã dùng thật cho compatibility catalog + admin APIs |
| `cartService.js` | Đã dùng thật |
| `rentalOrderService.js` | Đã dùng thật cho customer + staff order APIs; có helper timeline nhưng backend chưa có |
| `paymentService.js` | Đã dùng thật |
| `uploadService.js` | Đã dùng thật |
| `interactionsService.js` | Gọi backend chưa tồn tại (`/api/ai/track`) |

## Hooks thực tế
| Hook | Vai trò |
| --- | --- |
| `useCatalogCostumes` | Tải và map catalog costumes qua compatibility endpoint |
| `useCatalogFilters` | Filter UI catalog |
| `useShopCostumes` | Tải all / seasonal / recommended costumes |
| `useRentalOrders` | Customer order list + detail |
| `useStaffRentalOrders` | Staff order list/detail + handover |
| `useAdminCostumes` | Admin list/create/update costume |
| `useCosplayFilters` | Filter UI cosplay |

## Mức độ tích hợp theo page
| Page | Trạng thái |
| --- | --- |
| `UserAccountPage` | Login + OTP register đã nối backend thật |
| `RentalOrderCheckoutPage` | Tạo order thật, nhưng pricing UI vẫn hard-code |
| `PaymentPage` | Đã lấy order detail và init payment thật |
| `RentalOrdersPage` | Đã dùng customer order APIs thật |
| `AdminDashboardPage` | Product tab đã nối backend thật; overview/support/reports vẫn hard-code |
| `StaffDashboardPage` | Đã nối backend thật cho list/detail/handover; upload ảnh có thể fail với pure `STAFF` do role backend upload đang lệch |
| `CatalogPage` / `HomePage` / `ShopPage` | Đã tải dữ liệu thật từ backend |
| `ChatPage` | Frontend-only |
| `CostumeDetailPage` | Product detail đã có, review vẫn local-only |

## Hành vi frontend quan trọng
- `apiClient` tự động thêm `Authorization: Bearer <token>` nếu localStorage có `accessToken`.
- `apiClient` bật `withCredentials: true` để refresh cookie chạy được.
- Auth service có `unwrapApiResponse` cho endpoint auth wrapper.
- Register UI hiện tại chỉ hỗ trợ Gmail OTP flow, không dùng direct register non-Gmail dù service đã có.
- Cart flow:
  - nếu user đăng nhập và item có `costumeItemId + rentalStartDate + rentalEndDate` thì gọi backend cart
  - nếu không, frontend fallback sang local cart
- `cartSlice` có `quantity` cho local UX, nhưng backend cart và checkout thật vẫn xoay quanh physical `CostumeItem` / `sku`.
- Checkout page lưu `pendingOrderId` vào Zustand để đưa sang payment page.
- Payment page tự tính `orderTotal = finalAmount + totalDeposit` để hiển thị tổng thanh toán.

## Mock / placeholder / partial integration
- `ChatPage` hiện chưa có backend.
- `ProductReviewsSection` hiện là local UI.
- `rentalOrderService.fetchOrderTimeline()` gọi endpoint backend chưa tồn tại.
- Voucher `AURA20WELCOME` và tổng tiền trên checkout page hiện là UI hard-code.
- `AdminDashboardPage` có:
  - `supportTickets` hard-code
  - `metricCards` hard-code

## Lệch hoặc giới hạn hiện tại
- Frontend đang dùng song song:
  - `catalogService` -> `/api/public/catalog/*`
  - `costumeService` -> `/api/costumes*`
- `useCatalogCostumes` và `useShopCostumes` đang dùng compatibility endpoints, không dùng public namespaced endpoints.
- Cart source of truth chưa thuần backend-first vì còn local fallback.
- Staff handover form có upload component, nhưng backend upload chỉ authorize `ADMIN` và `CUSTOMER`.
- Frontend không nhận `refreshToken` trong JSON auth response; refresh flow phụ thuộc cookie thật.

## Need verify in code
- Có nên bỏ local cart fallback sau khi customer flow ổn định hay không.
- Có nên hợp nhất catalog API layer về một bộ endpoint duy nhất hay không.

## AI Recommendation MVP da co tren frontend
- Service moi:
  - `aiRecommendationService.js`
- Hook moi:
  - `useAiRecommendations`
  - `useAdminAiManagement`
- UI moi:
  - `AiStylistBox`
  - `PersonalizedRecommendationSection`
  - `OutfitComboSection`
  - `AdminProductAiMetadataForm`
  - `AdminTrendManagerSection`
- Tich hop page:
  - `HomePage`: personalized recommendation section cho user da login
  - `ShopPage`: AI Stylist Box + recommendation co reason
  - `CostumeDetailPage`: outfit combo section
  - `AdminDashboardPage`: metadata AI form + trend manager
- `interactionsService` da noi that voi backend `/api/ai/track`
  - product view
  - catalog search/filter
  - add to cart
  - recommendation click
