# FRONTEND_CONTEXT.md

## Tổng quan frontend
- Stack: React 19 + Vite + Tailwind CSS.
- Có sử dụng React Router.
- Điều hướng theo page được điều khiển bằng URL routing.
- Auth và cart được lưu trong Redux và persist xuống localStorage.

## Cấu trúc frontend chính
| Đường dẫn | Mục đích |
| --- | --- |
| `src/App.jsx` | App shell chính và route tree |
| `src/pages/` | Component cấp màn hình |
| `src/components/` | UI section có thể tái sử dụng |
| `src/hooks/` | Hook nạp dữ liệu và quản lý page state |
| `src/services/` | Tầng gọi API theo từng domain |
| `src/store/` | Redux + helper localStorage |
| `src/utils/` | Mapping, format, helper role |
| `src/routing/` | Helper điều hướng và mapping route |

## Mô hình route hiện tại
- Các route chính:
  - `/`
  - `/catalog`
  - `/shop`
  - `/checkout`
  - `/payment`
  - `/success`
  - `/chat`
  - `/orders`
  - `/admin`
  - `/staff`
  - `/yearbook`
  - `/cosplay`
  - `/events`
  - `/care`
  - `/account`
  - `/products/:productId`

## Tóm tắt pages / routes
| Trang | Nguồn dữ liệu | Ghi chú |
| --- | --- | --- |
| `Home` | `useCostumes()` | Dùng dữ liệu catalog cho featured/trending |
| `Catalog` | `useCostumes()` + filter local | Frontend vẫn cần đồng bộ shape response với backend |
| `Shop` | `useShopProducts()` | Gọi recommendation/seasonal API hiện backend còn thiếu |
| `Yearbook` | `useCostumes('yearbook')` | Filter đặc thù UI |
| `Cosplay` | `useCostumes('cosplay')` | Filter group thuần UI |
| `Events` | `useCostumes('events')` | Filter group thuần UI |
| `Account` | `loginUser` / `registerUser` | Vẫn có nguy cơ lệch response shape với backend |
| `Checkout` | Redux cart + `useCostumes()` | Pricing flow còn nghiêng về local/mock |
| `Payment` | State local + `createPayment` | Vẫn đang dùng demo order id và payload chưa khớp hoàn toàn |
| `Orders` | `useUserOrders()` | Hiện vẫn load nhầm staff endpoint |
| `AdminDashboard` | `useAdminProducts()` | Backend CRUD còn thiếu |
| `StaffDashboard` | `useStaffOrders()` | Backend staff API còn thiếu |
| `Chat` | state local | Chưa tích hợp backend |
| `ProductDetail` | route param + state điều hướng + review local | Review hiện chỉ tồn tại ở frontend |

## Component tái sử dụng
- UI dùng chung:
  - `components/ui/AlertMessage.jsx`
  - `components/ui/EmptyState.jsx`
  - `components/ui/LoadingGrid.jsx`
- Layout:
  - `components/layout/Navbar.jsx`
  - `components/layout/Footer.jsx`
- Card catalog/shop/product được dùng lại ở nhiều page.

## Hooks và state management
| Khu vực | Cách triển khai |
| --- | --- |
| Auth state | Redux `authSlice` |
| Cart state | Redux `cartSlice` |
| Local persistence | `browserStorage.js` |
| Catalog data | `useCostumes` |
| Shop tabs | `useShopProducts` |
| Admin products | `useAdminProducts` |
| Staff orders | `useStaffOrders` |
| User orders | `useUserOrders` |

## Quy tắc gọi API trong code hiện tại
- Tầng service frontend hiện dùng `axios`.
- Service đã được tách theo domain:
  - `authService.js`
  - `costumesService.js`
  - `ordersService.js`
  - `paymentsService.js`
  - `interactionsService.js`
  - `http/` cho client và request helper
- Các vấn đề service layer hiện tại:
  - chưa có auth header management hoàn chỉnh cho API protected
  - chưa có refresh-token/session handling đầy đủ
  - một số path vẫn chưa khớp backend thật
  - một số payload vẫn chưa khớp DTO backend
- Pattern loading/error:
  - hook thường expose `isLoading` và `error`
  - UI thường dùng `AlertMessage`, text inline hoặc `EmptyState`
  - một vài flow vẫn dùng `alert(...)`

## Component / page có khả năng quá lớn
| File | Số dòng xấp xỉ | Khuyến nghị |
| --- | ---: | --- |
| `src/pages/Checkout.jsx` | 223 | Tách phần chuẩn bị dữ liệu, voucher, related-items |
| `src/components/layout/Navbar.jsx` | 198 | Tách mobile/menu/search/cart/auth |
| `src/components/product/ProductReviewsSection.jsx` | 171 | Tách stats, filter bar, form, list |
| `src/components/admin/AdminProductsSection.jsx` | 165 | Tách filters, table/list, form |
| `src/pages/CustomerCare.jsx` | 159 | Tách FAQ, size guide, stylist CTA |
| `src/pages/StaffDashboard.jsx` | 145 | Tách container và panel orchestration |
| `src/pages/AdminDashboard.jsx` | 144 | Tách shell và tab container |

## Rủi ro frontend quan trọng
- `getUserRoles` kỳ vọng `user.role` là string, nhưng auth response backend thực tế được bọc khác.
- `mapCostumeToProduct` kỳ vọng category là string, trong khi backend có thể trả category object.
- Cart vẫn là local-first; chưa tích hợp thật với backend cart.
- Payment page đang dùng `demoOrderId = 1`.
- Lịch sử đơn hàng đang dùng nhầm staff endpoint thay vì customer order endpoint.
