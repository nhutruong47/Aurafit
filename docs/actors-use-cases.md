# Actor cua he thong AuraFit

## Tong quan

He thong AuraFit co 3 nhom actor chinh:

- Guest: nguoi dung chua dang nhap, co the xem va tim trang phuc, chat voi AI, dang ky va dang nhap.
- Customer: nguoi dung da co tai khoan, co the thue trang phuc, thanh toan, theo doi don va nhan goi y AI.
- Staff: nhan vien van hanh, phu trach xac nhan don, ban giao, nhan lai va xu ly tinh trang trang phuc.

## Bang actor va use case

| Actor | Use case |
| --- | --- |
| Guest | Xem trang phuc |
| Guest | Tim kiem trang phuc |
| Guest | Chat voi AI |
| Guest | Dang ky tai khoan |
| Guest | Dang nhap |
| Customer | Quan ly tai khoan |
| Customer | Thue trang phuc |
| Customer | Thanh toan |
| Customer | Theo doi don thue |
| Customer | Nhan goi y AI |
| Customer | Chat voi AI |
| Staff | Xac nhan don thue |
| Staff | Ban giao trang phuc |
| Staff | Nhan lai trang phuc |
| Staff | Kiem tra tinh trang |
| Staff | Xu ly hu hong/mat do |

## Mo ta ngan cac actor

### Guest

Guest la nguoi truy cap he thong khi chua dang nhap. Actor nay chu yeu thuc hien cac thao tac kham pha san pham va tuong tac ban dau voi he thong.

Use case chinh:

- Xem danh sach trang phuc.
- Tim kiem trang phuc theo nhu cau.
- Chat voi AI de hoi ve san pham, phong cach hoac quy trinh thue.
- Dang ky tai khoan.
- Dang nhap vao he thong.

Tai lieu chi tiet:

- [Use case: Dang ky tai khoan](./use-case-register.md)
- [Use case: Xem danh sach trang phuc](./use-case-view-costumes.md)
- [Use case: Xem chi tiet trang phuc](./use-case-view-costume-detail.md)
- [Use case: Chat voi AI](./use-case-ai-chat.md)
- [Use case: Them trang phuc vao gio hang](./use-case-add-to-cart.md)
- [Use case: Checkout va tao don thue](./use-case-checkout.md)
- [Use case: Staff ban giao trang phuc](./use-case-staff-handover.md)
- [Use case: Staff nhan tra va kiem tra trang phuc](./use-case-staff-return.md)
- [Use case: Hoan tien coc sau khi nhan tra](./use-case-deposit-refund.md)

### Customer

Customer la nguoi dung da dang nhap va co nhu cau thue trang phuc. Actor nay thuc hien cac chuc nang lien quan den dat thue, thanh toan va quan ly don hang.

Use case chinh:

- Quan ly thong tin tai khoan.
- Thue trang phuc.
- Thanh toan don thue.
- Theo doi trang thai don thue.
- Nhan goi y trang phuc/phu kien tu AI.
- Chat voi AI de duoc tu van.

### Staff

Staff la nhan vien quan ly quy trinh van hanh don thue. Actor nay dam bao don hang duoc xac nhan, ban giao, thu hoi va kiem tra dung quy trinh.

Use case chinh:

- Xac nhan don thue.
- Ban giao trang phuc cho khach.
- Nhan lai trang phuc sau thoi gian thue.
- Kiem tra tinh trang trang phuc.
- Xu ly truong hop hu hong hoac mat do.

## So do use case Mermaid

```mermaid
flowchart LR
  Guest[Guest]
  Customer[Customer]
  Staff[Staff]

  UC_View[Xem trang phuc]
  UC_Search[Tim kiem trang phuc]
  UC_AIChat[Chat voi AI]
  UC_Register[Dang ky tai khoan]
  UC_Login[Dang nhap]

  UC_Account[Quan ly tai khoan]
  UC_Rent[Thue trang phuc]
  UC_Payment[Thanh toan]
  UC_Track[Theo doi don thue]
  UC_AIRecommend[Nhan goi y AI]

  UC_Confirm[Xac nhan don thue]
  UC_Handover[Ban giao trang phuc]
  UC_Return[Nhan lai trang phuc]
  UC_Check[Kiem tra tinh trang]
  UC_Damage[Xu ly hu hong/mat do]

  Guest --> UC_View
  Guest --> UC_Search
  Guest --> UC_AIChat
  Guest --> UC_Register
  Guest --> UC_Login

  Customer --> UC_Account
  Customer --> UC_Rent
  Customer --> UC_Payment
  Customer --> UC_Track
  Customer --> UC_AIRecommend
  Customer --> UC_AIChat

  Staff --> UC_Confirm
  Staff --> UC_Handover
  Staff --> UC_Return
  Staff --> UC_Check
  Staff --> UC_Damage
```

## Goi y phan quyen

| Chuc nang | Guest | Customer | Staff |
| --- | --- | --- | --- |
| Xem trang phuc | Co | Co | Co |
| Tim kiem trang phuc | Co | Co | Co |
| Chat voi AI | Co | Co | Khong bat buoc |
| Dang ky tai khoan | Co | Khong | Khong |
| Dang nhap | Co | Co | Co |
| Quan ly tai khoan | Khong | Co | Co |
| Thue trang phuc | Khong | Co | Khong |
| Thanh toan | Khong | Co | Khong |
| Theo doi don thue | Khong | Co | Co |
| Xac nhan don thue | Khong | Khong | Co |
| Ban giao trang phuc | Khong | Khong | Co |
| Nhan lai trang phuc | Khong | Khong | Co |
| Kiem tra tinh trang | Khong | Khong | Co |
| Xu ly hu hong/mat do | Khong | Khong | Co |
