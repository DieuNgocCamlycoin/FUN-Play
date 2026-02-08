

# Đổi màu chữ và icon trong menu sang màu xanh logo FUN Play (#0066FF)

## Tình trạng hiện tại

Các menu điều hướng (sidebar, drawer, bottom nav) hiện đang sử dụng màu `text-sky-700` (xanh trời đậm) cho cả icon và chữ. Cần đổi sang màu xanh logo FUN Play `#0066FF` (Cosmic Sapphire) để đồng nhất với thiết kế đã cập nhật trước đó (Filter Chips, tiêu đề trang).

## Danh sách thay đổi

### 1. `src/components/Layout/Sidebar.tsx` (Desktop Sidebar)
- Đổi tất cả `text-sky-700` thanh `text-[#0066FF]` cho icon va text trong menu items
- Ap dung cho: FUN Ecosystem items, Main nav, Library, Leaderboard, Manage, Wallet sections

### 2. `src/components/Layout/CollapsibleSidebar.tsx` (Desktop Collapsible Sidebar)
- Doi `text-sky-700` thanh `text-[#0066FF]` trong NavButton component (icon va text)
- Ap dung cho tat ca sections: FUN Ecosystem, Main nav, Library, Rewards, Manage

### 3. `src/components/Layout/MobileDrawer.tsx` (Mobile Drawer Menu)
- Doi `text-sky-700` thanh `text-[#0066FF]` trong NavButton va FunPlatformButton components
- Ap dung cho tat ca sections trong mobile drawer

### 4. `src/components/Layout/MobileBottomNav.tsx` (Mobile Bottom Navigation)
- Doi mau inactive items tu `text-muted-foreground` thanh `text-[#0066FF]` de dong nhat
- Giu nguyen `text-primary` cho active state

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File can sua | 4 file |
| Tong thay doi | ~12 cho (text-sky-700 va text-muted-foreground) |
| Co so du lieu | Khong |
| Dong bo Mobile | Co (MobileDrawer + MobileBottomNav) |

## Chi tiet ky thuat

### Sidebar.tsx
- Dong icon: `text-sky-700` -> `text-[#0066FF]` (khoang 6 cho)
- Dong text: `text-sky-700` -> `text-[#0066FF]` (khoang 6 cho)

### CollapsibleSidebar.tsx
- NavButton icon (dong 135): `text-sky-700` -> `text-[#0066FF]`
- NavButton text (dong 138): `text-sky-700` -> `text-[#0066FF]`

### MobileDrawer.tsx
- NavButton icon (dong 141): `text-sky-700` -> `text-[#0066FF]`
- NavButton text (dong 143): `text-sky-700` -> `text-[#0066FF]`
- FunPlatformButton text (dong 169): `text-sky-700` -> `text-[#0066FF]`

### MobileBottomNav.tsx
- Inactive nav items (dong 68): `text-muted-foreground` -> `text-[#0066FF]`

## Ket qua

- Tat ca icon va text trong menu dieu huong se hien thi mau xanh logo #0066FF
- Dong nhat voi Filter Chips Bar va tieu de trang da cap nhat truoc do
- Ap dung dong thoi cho Desktop (Sidebar, CollapsibleSidebar) va Mobile (Drawer, BottomNav)
