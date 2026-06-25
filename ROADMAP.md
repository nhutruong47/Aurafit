# ROADMAP.md

## Mục tiêu
- Đưa AuraFit từ trạng thái "core flow đã có, nhưng còn một số hybrid/mock zone" sang trạng thái:
  - customer flow ổn định end-to-end
  - admin/staff scope rõ ràng
  - pricing và status semantics nhất quán
  - setup local / security / docs sạch hơn

## Đã xác nhận hoàn thành
- [x] Context docs đã được audit lại theo code hiện tại
- [x] Backend đã có admin costume APIs
- [x] Backend đã có staff handover APIs
- [x] Frontend đã nối thật customer orders
- [x] Frontend đã bỏ hard-coded demo order id trong payment flow
- [x] Runtime config đã được đổi sang env vars thay vì hard-code datasource trong `application-dev.yml`
- [x] Phase 1 AI Recommendation MVP da duoc implement

## P0
- [ ] Đồng bộ Docker Postgres port và sample `DATABASE_URL`
- [ ] Chốt lại `finalAmount` / `payment amount` / `totalPrice` / deposit semantics
- [ ] Xử lý lệch `quantity` với inventory model `CostumeItem`
- [ ] Thay runtime exception generic trong cart flow bằng custom exception
- [ ] Chốt secret-management workflow rõ ràng qua env / `.env`

## P1
- [ ] Quyết định cart source of truth: backend-first hay hybrid
- [ ] Quyết định có cần direct register non-Gmail trên frontend hay không
- [ ] Quyết định có giữ 2 bộ catalog endpoints hay hợp nhất
- [ ] Hoàn thiện order status workflow cho staff pickup / return nếu đây là business rule thật
- [ ] Căn chỉnh role upload giữa staff UI và backend
- [ ] Thêm test profile backend để `.\\mvnw.cmd test` ổn định hơn
- [ ] Thêm migration tool
- [ ] Quyết định khi nao chuyen AI embedding sang `pgvector`

## P2
- [ ] Đồng bộ checkout pricing UI theo backend thật
- [ ] Đánh dấu rõ các zone mock:
  - chat
  - reviews
  - interactions
  - order timeline
  - admin overview/support/reports
- [ ] Tách nhỏ các page/component lớn nếu tiếp tục refactor frontend
- [ ] Mo rong AI recommendation voi wishlist, batch profile refresh, va external trend sync

## Definition of Done cho một đợt tích hợp lớn
- [ ] Tài liệu context liên quan được cập nhật
- [ ] Frontend build pass nếu có sửa frontend: `npm exec vite build`
- [ ] Backend test pass nếu có sửa backend: `.\\mvnw.cmd test`
- [ ] Setup local không còn mơ hồ về DB port / env
