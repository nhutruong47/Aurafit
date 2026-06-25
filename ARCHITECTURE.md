# ARCHITECTURE.md

## Tổng quan hệ thống
- Kiến trúc hiện tại là monorepo gồm hai ứng dụng:
  - `frontend/`: client React
  - `backend/`: REST API Spring Boot
- Hạ tầng local tối giản:
  - PostgreSQL
  - pgAdmin
- Không tìm thấy Redis, RabbitMQ, hàng đợi nền, hay object storage trong mã nguồn.

## Kiến trúc backend
- Backend theo kiến trúc Spring phân lớp:
  - `controller/` cho HTTP endpoint
  - `service/` và `service.impl/` cho logic nghiệp vụ
  - `repository/` cho JPA persistence
  - `entity/` cho mô hình domain
  - `dto/request` và `dto/response` cho contract
  - `security/` cho JWT auth
  - `config/` cho security, OpenAPI, seed data
  - `exception/` cho xử lý lỗi tập trung
- Entity đa số dùng `LAZY`, repository dùng `JOIN FETCH` để tránh N+1 ở các luồng nóng.
- `BaseEntity` cung cấp audit timestamp qua JPA auditing.

## Kiến trúc frontend
- Frontend là một React app dùng React Router cho routing theo URL.
- Điều hướng được xử lý bằng route thật thay vì state giả lập.
- Local state được lưu bền vững:
  - auth user trong Redux + localStorage
  - cart trong Redux + localStorage
- API access được tách theo domain trong `frontend/src/services/`.
- Hooks gói gọn việc nạp dữ liệu và UI state cho các màn hình chính.

## Database / hạ tầng
- PostgreSQL là relational store chính.
- Profile dev:
  - DB ở `localhost:5433`
  - `ddl-auto: update`
  - seed data dev đang bật
- Profile prod:
  - env vars được externalize
  - `ddl-auto: validate`
- Docker Compose cung cấp:
  - `postgres`
  - `pgadmin`

## Giao tiếp giữa service / module
| Nguồn | Gọi tới | Ghi chú |
| --- | --- | --- |
| Frontend `useCostumes` | Backend catalog API | Vẫn cần đồng bộ thêm path/query thật |
| Frontend account page | Backend user auth API | Vẫn có chỗ lệch response shape |
| Frontend payment page | Backend payment API | Vẫn còn payload/path chưa khớp hoàn toàn |
| Backend checkout | User, cart, costume item, rental order repositories | Có transaction |
| Backend payment webhook | Payment repo + rental order repo | Có transaction |
| Backend auth service | OTP service + email service + user repo | OTP đang lưu in-memory |

## Dependency quan trọng
| Dependency | Tại sao quan trọng |
| --- | --- |
| Spring Security | Bảo vệ toàn bộ endpoint không công khai |
| JJWT | Sinh và validate access/refresh token |
| JavaMailSender | Gửi OTP Gmail |
| Spring Data JPA | Abstraction persistence chính |
| Tailwind CSS | Toàn bộ styling frontend theo utility-first |
| Redux Toolkit | Reducer và persistence cho auth/cart |
| React Router | Điều hướng theo URL ở frontend |
| Axios | HTTP client cho frontend service layer |

## Khoảng trống kiến trúc
- Frontend vẫn giả định một số API chưa được backend triển khai.
- Không thấy công cụ migration như Flyway/Liquibase.
- OTP cache vẫn chỉ ở memory, không phù hợp cho multi-instance deployment.
- Nghiệp vụ staff/admin phần lớn mới dừng ở mức UI.
