
# Tích hợp Angel AI Chat Overlay vào FUN Play

## Mục tiêu
Khi bấm nút Angel AI trên Header, mở cửa sổ chat overlay ngay trong trang hiện tại (giống FUN Profile) thay vì mở tab mới.

## Phân tích hiện trạng
- Nút Angel AI trên Header đang gọi `window.open("https://angel.fun.rich", "_blank")` -- mở tab mới
- Component `AngelChat` đã có sẵn với đầy đủ tính năng (chat, lịch sử, streaming) nhưng chưa được sử dụng
- Component `AngelMascot` (mascot nổi) cũng chưa được import vào layout

## Giải pháp

### Bước 1: Cập nhật Header.tsx
- Thêm state `isChatOpen` để điều khiển hiển thị AngelChat
- Thay `window.open(...)` bằng `setIsChatOpen(true)`
- Render component `AngelChat` với `isOpen={isChatOpen}`

### Bước 2: Kiểm tra AngelChat hiển thị đúng
- AngelChat đã có sẵn giao diện popup/overlay (fixed position, z-index cao)
- Đảm bảo hoạt động tốt trên cả desktop và mobile

## Chi tiết kỹ thuật

**File thay doi:** `src/components/Layout/Header.tsx`
- Import `AngelChat` from `@/components/Mascot/AngelChat`
- Thêm `useState` cho `isChatOpen`
- Thay handler `onClick` của nút Angel AI
- Thêm `<AngelChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />` vào cuoi component

Thay doi nho gon, chi 1 file, khong anh huong cac tinh nang khac.
