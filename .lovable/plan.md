

# Đổi màu chữ và icon trong menu từ #0066FF sang #004eac

## Tình trạng hiện tại

Tất cả icon và chữ trong menu điều hướng, tiêu đề trang, và Filter Chips đang sử dụng màu `#0066FF`. Cần đổi toàn bộ sang màu mới `#004eac`.

## Danh sách thay đổi (10 file, ~30 chỗ)

### 1. `src/components/Layout/Sidebar.tsx`
- Thay tất cả `text-[#0066FF]` thanh `text-[#004eac]` (16 cho: icon va text trong FUN Ecosystem, Main nav, Library, Leaderboard, Manage, Wallet)

### 2. `src/components/Layout/CollapsibleSidebar.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` trong NavButton component (2 cho: icon dong 135, text dong 138)

### 3. `src/components/Layout/MobileDrawer.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` trong NavButton va FunPlatformButton (3 cho: icon dong 141, text dong 143, text dong 169)

### 4. `src/components/Layout/MobileBottomNav.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho inactive nav items (dong 68, 2 cho)

### 5. `src/components/Layout/CategoryChips.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho chip default state (dong 35, 3 cho: text, border, hover border)
- Thay `hover:text-[#0052CC]` thanh `hover:text-[#003d8a]` de giu ti le tuong phan nhat quan

### 6. `src/components/Video/ContinueWatching.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho tieu de "Tiep tuc xem" (dong 33)

### 7. `src/pages/WatchLater.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho tieu de "Xem sau" (dong 57)

### 8. `src/pages/WatchHistory.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho tieu de "Lich su xem" (dong 105)

### 9. `src/pages/Subscriptions.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho tieu de "Kenh da dang ky" (dong 135)

### 10. `src/pages/Index.tsx`
- Thay `text-[#0066FF]` thanh `text-[#004eac]` cho "FUN Play" branding (dong 354) va "Chua co video nao" (dong 378)

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File can sua | 10 file |
| Tong thay doi | ~30 cho thay the `#0066FF` -> `#004eac` |
| Co so du lieu | Khong |
| Dong bo Mobile | Co (MobileDrawer, MobileBottomNav, CategoryChips) |

## Ket qua

- Tat ca icon va text trong menu dieu huong se hien thi mau xanh dam moi `#004eac`
- Tieu de trang (Tiep tuc xem, Xem sau, Lich su xem, Kenh da dang ky) cung cap nhat
- Filter Chips (CategoryChips) cap nhat dong bo
- Ap dung dong thoi cho Desktop va Mobile
