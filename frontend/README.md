# React + Vite

Template này cung cấp cấu hình tối thiểu để chạy React trên Vite với HMR và một số rule ESLint cơ bản.

Hiện tại có hai plugin chính thức:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) dùng [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) dùng [SWC](https://swc.rs)

## React Compiler

React Compiler không được bật mặc định trong template này vì ảnh hưởng tới hiệu năng lúc phát triển và build. Nếu muốn thêm, xem tài liệu tại:

- [React Compiler Installation](https://react.dev/learn/react-compiler/installation)

## Mở rộng cấu hình ESLint

Nếu bạn đang phát triển ứng dụng production, nên cân nhắc dùng TypeScript với các rule lint có nhận biết kiểu dữ liệu. Có thể tham khảo:

- [Vite React TypeScript Template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)
- [`typescript-eslint`](https://typescript-eslint.io)
