# PROMPTING_GUIDE.md

## Quy tắc prompting chung
- Luôn yêu cầu Codex đọc các file context liên quan trước.
- Yêu cầu Codex phân biệt rõ:
  - phần đã được triển khai trong code
  - phần chỉ là placeholder/frontend-only
  - phần backend chưa hỗ trợ
- Yêu cầu Codex không tự suy diễn quy tắc nghiệp vụ.
- Yêu cầu Codex đánh dấu các điểm chưa chắc là `Need verify in code`.

## Nên đọc file context nào
| Tác vụ | Context bắt buộc |
| --- | --- |
| Làm API backend | `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `BACKEND_CONTEXT.md`, `API_CONTEXT.md`, `DATABASE_CONTEXT.md`, `USER_FLOW.md`, `RISK.md` |
| Tích hợp frontend | `PROJECT_CONTEXT.md`, `FRONTEND_CONTEXT.md`, `API_CONTEXT.md`, `USER_FLOW.md`, `RISK.md` |
| Review business flow | `PROJECT_CONTEXT.md`, `USER_FLOW.md`, `DECISIONS.md`, `RISK.md` |
| Refactor | Context liên quan ở trên + `AGENTS.md` |
| Testing | Context module liên quan + `RISK.md` + `TODO_CONTEXT.md` |

## Mẫu prompt: Review bug
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `RISK.md`, và các file context module liên quan trước.

Nhiệm vụ: điều tra và sửa bug này: <mô tả bug>.

Yêu cầu:
- xác định root cause từ code hiện tại, không dựa trên giả định
- giữ nguyên hành vi hiện có ngoài phần bug fix
- nêu rõ nếu có lệch contract giữa frontend/backend
- nếu có rule nào chưa rõ, đánh dấu `Need verify in code`
- chạy bước verify nhỏ nhất phù hợp sau khi sửa
```

## Mẫu prompt: Refactor một page frontend
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `FRONTEND_CONTEXT.md`, `API_CONTEXT.md`, và `RISK.md` trước.

Nhiệm vụ: refactor page `<path>` để tăng readability và maintainability mà không đổi UX/hành vi.

Yêu cầu:
- giữ nguyên hành vi hiển thị hiện tại
- tách logic lớn thành component/hook nhỏ hơn
- không tự tạo API contract mới
- chỉ ra rõ phần nào đang là mock-only so với backend thật
- chạy `npm exec vite build` sau khi sửa
```

## Mẫu prompt: Thêm API backend
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `BACKEND_CONTEXT.md`, `API_CONTEXT.md`, `DATABASE_CONTEXT.md`, `USER_FLOW.md`, và `DECISIONS.md` trước.

Nhiệm vụ: thêm backend API cho `<feature>`.

Yêu cầu:
- bám theo cấu trúc controller/service/repository/DTO hiện tại
- dùng enum/status có sẵn nếu có thể
- lấy current user từ JWT context khi có ownership
- cập nhật `API_CONTEXT.md` và các file context liên quan
- nếu business rule chưa rõ trong code, ghi `Need verify in code` trước khi đưa ra giả định rủi ro
```

## Mẫu prompt: Nối API backend vào frontend
```md
Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `FRONTEND_CONTEXT.md`, `API_CONTEXT.md`, `USER_FLOW.md`, và `RISK.md` trước.

Nhiệm vụ: tích hợp flow frontend `<feature>` với backend API thật.

Yêu cầu:
- đồng bộ service layer frontend với path và DTO shape thật của backend
- normalize wrapped backend response ở một chỗ
- không giữ demo id hoặc fake payload field
- hiển thị loading và error state rõ ràng
- chạy `npm exec vite build` sau khi sửa
```

## Mẫu prompt: Review business flow
```md
Đọc `PROJECT_CONTEXT.md`, `USER_FLOW.md`, `DECISIONS.md`, `API_CONTEXT.md`, `DATABASE_CONTEXT.md`, và `RISK.md` trước.

Nhiệm vụ: review business flow cho `<tên flow>`.

Yêu cầu:
- tách rõ phần triển khai hiện tại và hành vi dự kiến
- chỉ ra API còn thiếu, schema gap, và giả định rủi ro
- không tự tạo rule nếu không nhìn thấy trong code
- đánh dấu điểm chưa rõ là `Need verify in code`
```

## Mẫu prompt: Viết test
```md
Đọc `AGENTS.md`, `BACKEND_CONTEXT.md` hoặc `FRONTEND_CONTEXT.md`, `API_CONTEXT.md`, và `RISK.md` trước.

Nhiệm vụ: thêm test cho `<module hoặc flow>`.

Yêu cầu:
- cover hành vi hiện tại trong code, không phải hành vi kỳ vọng ở tương lai
- ghi rõ blocker setup như phụ thuộc DB nếu có
- giữ test tối thiểu và tập trung
- nêu nếu cần test profile hoặc mock boundary
```
