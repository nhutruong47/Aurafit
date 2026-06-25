# PROMPTING_GUIDE.md

## Quy tắc chung
- Luôn yêu cầu agent đọc:
  - `AGENTS.md`
  - `PROJECT_CONTEXT.md`
  - context module liên quan
- Luôn tách rõ:
  - phần đã triển khai thật trong code
  - phần có API backend nhưng frontend chưa expose đầy đủ
  - phần frontend-only / mock / placeholder
- Không tự suy diễn thêm business rule nếu không thấy trong code.
- Nếu nghĩa nghiệp vụ chưa rõ, đánh dấu `Need verify in code`.

## File context nên đọc theo task
| Tác vụ | File bắt buộc |
| --- | --- |
| Backend API | `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `BACKEND_CONTEXT.md`, `API_CONTEXT.md`, `DATABASE_CONTEXT.md`, `user-flow.md`, `RISK.md` |
| Frontend integration | `PROJECT_CONTEXT.md`, `FRONTEND_CONTEXT.md`, `API_CONTEXT.md`, `user-flow.md`, `RISK.md` |
| Business flow review | `PROJECT_CONTEXT.md`, `user-flow.md`, `DECISIONS.md`, `RISK.md` |
| Refactor | file trên + `AGENTS.md` |
| Setup / infra / DB | `ARCHITECTURE.md`, `DATABASE_CONTEXT.md`, `RISK.md`, `TODO_CONTEXT.md` |

## Lưu ý đặc thù của repo này
- Catalog hiện có 2 lớp endpoint:
  - `/api/public/catalog/*`
  - `/api/costumes*`, `/api/categories`
- OTP hiện được persist trong DB, không phải in-memory cache.
- Auth response body không có `refreshToken`; token này đi qua HttpOnly cookie.
- Admin/staff APIs đã tồn tại, nhưng một số tab frontend vẫn mock.
- Customer cart hiện là hybrid flow, chưa thuần backend-first.
- Staff UI có image uploader, nhưng backend upload hiện chỉ authorize `ADMIN` và `CUSTOMER`.

## Mẫu prompt: review bug
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `RISK.md`, và context module liên quan trước.

Nhiệm vụ: điều tra và sửa bug này: <mô tả bug>.

Yêu cầu:
- xác định root cause từ code hiện tại
- không đổi business behavior ngoài phần bug fix
- nếu có lệch FE/BE contract thì chỉ ra rõ
- nếu có chỗ nghĩa nghiệp vụ chưa chắc, ghi `Need verify in code`
- chạy bước verify nhỏ nhất phù hợp sau khi sửa
```

## Mẫu prompt: tích hợp frontend với backend
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `FRONTEND_CONTEXT.md`, `API_CONTEXT.md`, `user-flow.md`, và `RISK.md` trước.

Nhiệm vụ: nối flow frontend `<feature>` với backend API thật.

Yêu cầu:
- bám đúng path và DTO shape trong `API_CONTEXT.md`
- nếu repo đang có 2 lớp endpoint, nói rõ đang dùng lớp nào và vì sao
- không để lại demo id / fake payload
- chỉ rõ phần nào vẫn là mock-only
- chạy `npm exec vite build` nếu có sửa frontend
```

## Mẫu prompt: thêm / sửa backend API
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `BACKEND_CONTEXT.md`, `API_CONTEXT.md`, `DATABASE_CONTEXT.md`, `user-flow.md`, và `DECISIONS.md` trước.

Nhiệm vụ: thêm hoặc sửa backend API cho `<feature>`.

Yêu cầu:
- giữ đúng layered architecture hiện tại
- dùng enum/status hiện có nếu phù hợp
- lấy current user từ JWT context khi có ownership
- nếu sửa contract, cập nhật lại context docs liên quan
- nếu business rule chưa rõ, đánh dấu `Need verify in code`
```
