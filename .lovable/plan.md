
# Kế Hoạch Làm Sạch Background FUN Play

## Tổng Quan Vấn Đề

Hiện tại nền tảng FUN Play có nhiều hình nền và hiệu ứng đang hiển thị, gây rối mắt khi xem video. Cần loại bỏ tất cả để chỉ để lại nền trắng thuần túy.

## Các Thành Phần Cần Xử Lý

### 1. Hình Bé Ly (Homepage Background)
**File:** `src/pages/Index.tsx` (dòng 249-263)
**Nội dung:** Hình `homepage-background.png` (hình bé Ly) hiển thị fixed ở góc phải dưới

**Xử lý:** Xóa bỏ hoàn toàn đoạn code này

---

### 2. Hiệu Ứng Body Background (CSS)
**File:** `src/index.css` (dòng 156-208)
**Nội dung:**
- `body` có gradient background (dòng 158)
- `body::before` có radial gradient overlay với màu cyan/magenta/gold (dòng 163-176)
- `body::after` có cursor light beam effect (dòng 184-207)

**Xử lý:** 
- Đổi `body` background thành trắng thuần túy
- Xóa bỏ `body::before` overlay
- Xóa bỏ `body::after` cursor effect

---

### 3. Floating Particles (Trang chủ)
**File:** `src/pages/Index.tsx` (dòng 264-275)
**Nội dung:** Các hạt sáng (particles) bay lơ lửng trên trang chủ

**Xử lý:** Xóa bỏ hoàn toàn đoạn floating particles

---

### 4. Angel Mascot (Video bé Ly bay lơ lửng)
**File:** `src/App.tsx` (dòng 72)
**Nội dung:** Component `<AngelMascot />` hiển thị video bé Ly bay khắp màn hình

**Xử lý:** Xóa bỏ hoặc comment out component này

---

## Tóm Tắt Thay Đổi

| File | Thay Đổi |
|------|----------|
| `src/index.css` | Đổi body background thành `#FFFFFF`, xóa `::before` và `::after` |
| `src/pages/Index.tsx` | Xóa import `homepageBackground`, xóa background image div, xóa floating particles |
| `src/App.tsx` | Xóa import và sử dụng `<AngelMascot />` |

---

## Kết Quả Sau Khi Hoàn Thành

- Nền trắng thuần túy (#FFFFFF)
- Không có hình bé Ly
- Không có hiệu ứng gradient/particle
- Không có Angel mascot bay lơ lửng
- Video của user sẽ hiển thị nổi bật, dễ nhìn

---

## Chi Tiết Kỹ Thuật

### Thay đổi trong `src/index.css`:

```css
/* TRƯỚC */
body {
  @apply bg-background text-foreground;
  background: linear-gradient(135deg, #FFFFFF 0%, #F8F4FF 50%, #FFFFFF 100%);
  background-attachment: fixed;
  position: relative;
}

body::before {
  /* radial gradient overlay */
}

body::after {
  /* cursor light beam */
}

/* SAU */
body {
  @apply bg-background text-foreground;
  background: #FFFFFF;
}
/* Xóa body::before và body::after */
```

### Thay đổi trong `src/pages/Index.tsx`:

```tsx
/* XÓA dòng 20 */
// import homepageBackground from "@/assets/homepage-background.png";

/* XÓA dòng 249-275 */
// Homepage background image div
// Floating rainbow particles div
```

### Thay đổi trong `src/App.tsx`:

```tsx
/* XÓA dòng 52 */
// import { AngelMascot } from './components/Mascot/AngelMascot';

/* XÓA dòng 72 */
// <AngelMascot />
```
