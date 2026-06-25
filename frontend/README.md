# AuraFit Frontend

## Tổng quan
- Frontend của AuraFit được xây dựng bằng:
  - React 19
  - Vite 8
  - Tailwind CSS 3
  - React Router 7
  - Redux Toolkit
  - Zustand
- App này không còn là template mặc định; nó đã được tích hợp thật với nhiều flow backend AuraFit.

## Chạy local

### Yêu cầu
- Node.js phù hợp với Vite hiện tại
- Backend AuraFit chạy tại `http://localhost:8080`

### Biến môi trường
Tạo `.env` từ `.env.example`:

```env
VITE_APP_NAME=AuraFit
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT_MS=10000
```

### Lệnh chạy
```bash
npm install
npm run dev
```

### Build
```bash
npm exec vite build
```

## Cấu trúc quan trọng
| Thư mục / file | Vai trò |
| --- | --- |
| `src/App.jsx` | route tree và orchestration app |
| `src/pages/` | page-level screens |
| `src/components/` | UI sections và shared components |
| `src/services/` | API layer theo domain |
| `src/hooks/` | data hooks |
| `src/store/` | Redux và zustand stores |
| `src/utils/` | mapping / helper / formatter |

## Tích hợp backend hiện tại

### Đã nối thật
- Auth
- Cart
- Checkout
- Payment
- Customer orders
- Admin costume management
- Staff handover
- Upload image

### Vẫn còn partial / mock / gap
- Chat
- Product reviews
- Interaction tracking `/api/ai/track`
- Order timeline `/api/orders/{id}/timeline`
- Admin overview / support / reports
- Checkout pricing summary UI
- Staff upload image role gap với backend upload API

## Ghi chú kỹ thuật
- Axios client bật `withCredentials: true` để refresh token cookie chạy được.
- Access token được đọc từ localStorage và gắn vào header `Authorization`.
- Frontend hiện dùng song song:
  - `catalogService` cho `/api/public/catalog/*`
  - `costumeService` cho `/api/costumes*`
- Register UI hiện tại chỉ hỗ trợ Gmail OTP flow.
- Auth response body không có `refreshToken`; refresh flow phụ thuộc cookie thật.
