
# Kế Hoạch Sửa Lỗi Màn Hình Đen Khi Mở UploadWizard Desktop

## Vấn Đề Phát Hiện

Khi mở UploadWizard trên Desktop, màn hình bị **đen hoàn toàn** (black screen). Lỗi này xảy ra do:

1. **DialogOverlay có `bg-black/80`** che phủ gần như toàn bộ màn hình
2. **DialogContent styling có thể bị conflict** khi các class CSS override nhau
3. **Holographic border effect absolute** có thể che content vì không có proper z-index management
4. **Gradients với CSS variables** có thể render sai trong một số trường hợp

---

## Nguyên Nhân Gốc

Trong file `src/components/Upload/UploadWizard.tsx`:

```tsx
// Line 410-411: Holographic effect với absolute positioning
<div className="absolute inset-0 rounded-lg bg-gradient-to-r 
  from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] 
  to-[hsl(var(--cosmic-gold))] opacity-10 pointer-events-none" />
```

Effect này có thể che phủ toàn bộ content nếu z-index không đúng. Đồng thời, phần content chính cần đảm bảo có **z-index cao hơn**.

---

## Giải Pháp

### 1. Sửa z-index cho content area trong UploadWizard

Đảm bảo tất cả các phần content chính có `relative z-10` hoặc cao hơn để nằm trên holographic effect.

### 2. Thêm background color rõ ràng cho DialogContent

Đảm bảo `bg-background` không bị override và luôn visible.

### 3. Đơn giản hóa holographic effect

Giảm bớt complexity để tránh render issues.

---

## Files Thay Đổi

| Action | File | Mô tả |
|--------|------|-------|
| EDIT | `src/components/Upload/UploadWizard.tsx` | Sửa z-index và background styling |
| OPTIONAL | `src/components/ui/dialog.tsx` | Giảm opacity của overlay nếu cần |

---

## Chi Tiết Thay Đổi

### UploadWizard.tsx

```diff
// DialogContent - đảm bảo bg-background rõ ràng
- className={cn(
-   "!flex !flex-col p-0 gap-0 overflow-hidden relative bg-background border-border",
+ className={cn(
+   "!flex !flex-col p-0 gap-0 overflow-hidden relative bg-background border-border shadow-2xl",

// Holographic effect - thêm -z-10 để nằm dưới content
- <div className="absolute inset-0 rounded-lg bg-gradient-to-r ... opacity-10 pointer-events-none" />
+ <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r ... opacity-10 pointer-events-none" />

// Hoặc XÓA hoàn toàn holographic effect nếu gây vấn đề
```

### Backup Plan: Xóa hiệu ứng gradient phức tạp

Nếu vẫn còn lỗi, sẽ xóa toàn bộ holographic border effect:

```tsx
{/* Holographic border effect - REMOVED */}
{/* <div className="absolute inset-0 rounded-lg bg-gradient-to-r 
    from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] 
    to-[hsl(var(--cosmic-gold))] opacity-10 pointer-events-none" /> */}
```

---

## Giải Pháp Triệt Để (Nếu Cần)

Nếu các sửa nhỏ không hiệu quả, sẽ **đơn giản hóa hoàn toàn UploadWizard** bằng cách:

1. Xóa tất cả holographic/gradient effects
2. Sử dụng styling đơn giản, clean
3. Đảm bảo modal hoạt động ổn định trước, rồi mới thêm effects từ từ

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Màn hình đen khi mở modal | Modal hiển thị đúng với nội dung upload |
| Desktop bị lỗi | Desktop + Mobile đều hoạt động tốt |
| Không thể upload video | Users có thể upload video bình thường |

---

## Bước Test

1. Mở FUN Play trên Desktop
2. Click nút "Tạo" → "Tải video lên"
3. Modal UploadWizard phải hiển thị với giao diện wizard 4 bước
4. Có thể kéo-thả hoặc chọn video để upload
