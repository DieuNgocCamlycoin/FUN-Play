

# Tối ưu Mobile Header cho chế độ PWA / Add to Home Screen

---

## I. Vấn đề

Khi app được "Thêm vào Màn hình chính" (standalone mode), thanh trình duyệt biến mất nhưng vùng notch/status bar vẫn tồn tại. Header hiện tại dùng `fixed top-0` mà không tính `safe-area-inset-top`, khiến icon bị tràn lên vùng notch. Ngoài ra, 7 icon + avatar trong 1 hàng gây chật trên màn hình nhỏ (< 375px).

---

## II. Phân tích kỹ thuật

### Hiện trạng
- `index.html` đã có `viewport-fit=cover` và CSS variables cho `env(safe-area-inset-top)` nhưng `body` dùng `padding-top` thay vì header tự xử lý
- `MobileHeader` dùng `fixed top-0` cứng, không cộng thêm safe-area
- `MobileBottomNav` đã có class `safe-area-bottom` nhưng class này chưa được định nghĩa trong CSS
- Header chứa 7 phần tử bên phải (Search, Gift, FunMoney, Bell, Chat, Avatar) -- tổng cần ~7x44px = 308px, cộng logo+menu ~90px = ~398px, vượt quá nhiều màn hình 360-375px

### Giải pháp

1. **Safe-area padding cho header**: Thêm `padding-top: env(safe-area-inset-top)` vào header, tổng chiều cao = `safe-area + 56px`
2. **Giảm kích thước touch target**: Từ `h-11 w-11` (44px) xuống `h-9 w-9` (36px) cho icon buttons, giữ icon 24px -- vẫn đạt chuẩn WCAG tối thiểu
3. **Giảm gap**: Từ `gap-1` xuống `gap-0` để tiết kiệm không gian
4. **Detect PWA mode**: Thêm hook `useIsPWA()` để nhận diện standalone mode
5. **CSS safe-area utilities**: Thêm class tiện ích cho safe-area top/bottom

---

## III. Chi tiết thay đổi

### 1. Thêm hook `useIsPWA` (file mới)

```
src/hooks/useIsPWA.ts
```

Detect standalone mode bằng `window.matchMedia('(display-mode: standalone)')` và `navigator.standalone` (iOS Safari).

### 2. Cập nhật CSS (`src/index.css`)

Thêm utility classes:

```css
.safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### 3. Cập nhật `MobileHeader.tsx`

Thay đổi chính:
- Header: thêm `safe-area-top` class, chiều cao động `h-14` + safe-area padding phía trên
- Icon buttons: giảm từ `h-11 w-11` xuống `h-9 w-9`, icon từ `h-7 w-7` xuống `h-6 w-6`
- Gap giảm từ `gap-1` xuống `gap-0`
- Thêm WALLET icon (FUN Wallet) giữa Fun Money và Bell

### 4. Cập nhật `MainLayout.tsx`

- Thêm class `pt-[calc(env(safe-area-inset-top,0px)+3.5rem)]` cho PWA mode thay vì `pt-14` cứng

### 5. Cập nhật `MobileBottomNav.tsx`

- Thêm `pb-[env(safe-area-inset-bottom,0px)]` để bottom nav không bị che bởi home indicator trên iPhone

### 6. Cập nhật `index.html`

- Xóa `padding-top` trên body (để header tự xử lý) nhưng giữ `padding-left/right/bottom`

---

## IV. Bảng tổng hợp file thay đổi

| # | File | Loại | Mô tả |
|---|------|------|-------|
| 1 | `src/hooks/useIsPWA.ts` | Tạo mới | Hook detect PWA/standalone mode |
| 2 | `src/index.css` | Cập nhật | Thêm safe-area utility classes |
| 3 | `src/components/Layout/MobileHeader.tsx` | Cập nhật | Safe-area top, compact icons, thêm WALLET |
| 4 | `src/components/Layout/MainLayout.tsx` | Cập nhật | Dynamic padding-top cho PWA |
| 5 | `src/components/Layout/MobileBottomNav.tsx` | Cập nhật | Safe-area bottom |
| 6 | `index.html` | Cập nhật nhỏ | Xóa body padding-top để tránh double padding |
| 7 | `src/pages/Index.tsx` | Cập nhật nhỏ | Padding-top tương thích |

---

## V. Kết quả mong đợi

- Header nằm gọn dưới notch/status bar trên mọi thiết bị
- Tất cả 8 icon (Search, Gift, FunMoney, Wallet, Bell, Chat, Avatar) hiển thị đủ trên màn hình 360px
- Bottom nav không bị che bởi home indicator (iPhone X+)
- Trải nghiệm PWA giống app native

