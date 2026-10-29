# I.S.H.T.A.R — Ứng dụng quản lý học tập cá nhân

Bản giao diện Next.js App Router + Tailwind CSS + Lucide React, dùng React state và `localStorage` để mô phỏng dữ liệu trên trình duyệt.

## Khởi chạy
1. Cài Node.js 18.17 trở lên.
2. Mở thư mục dự án trong terminal.
3. Chạy `npm install`
4. Chạy `npm run dev`
5. Mở `http://localhost:3000`

## Các tính năng
- Đăng nhập giả lập và khảo sát 4 bước.
- Tổng quan tiến độ, deadline, biểu đồ thời gian học.
- Thời khóa biểu mẫu theo tuần.
- Danh sách bài tập, ưu tiên, ngày đến hạn, thông báo giả lập.
- Theo dõi điểm số/GPA với biểu đồ.
- Pomodoro 25/5 phút, 4 chu kỳ, tạm dừng/đặt lại và chuông âm thanh tổng hợp.
- Bộ sưu tập tài liệu có phân loại và ghi chú.
- Lộ trình IELTS/SAT, lưu điểm thi thử và biểu đồ.
- Flashcard, bài kiểm tra ngẫu nhiên 20 từ, chuỗi ngày học mô phỏng.
- Trợ lý Ishtar với lời thoại và phản hồi mẫu.

## Lưu ý quan trọng
- Đây là bản **frontend demo**: đăng nhập, email nhắc nhở, trợ lý, điểm số và streak đều mô phỏng; chưa có máy chủ, xác thực thật, gửi email thật hoặc đồng bộ nhiều thiết bị.
- Dữ liệu chính được lưu trên `localStorage` của trình duyệt. Dữ liệu mẫu và lịch biểu có thể được tùy chỉnh thêm.
- Ảnh bạn cung cấp được lưu ở `public/isthar-avatar.png` và dùng cho logo/avatar.
- Không dùng Web Speech API.
- Một số thành phần dùng kiểu dựng sẵn tương thích tinh thần shadcn/ui (Card, Button, Field, SelectField); có thể thay bằng các thành phần shadcn/ui chính thức nếu bạn muốn chuẩn hóa theo CLI.

## Cấu trúc
```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  ishtar-app.tsx
  ui.tsx
lib/
  utils.ts
public/
  isthar-avatar.png
```
