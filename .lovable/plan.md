
# Kế Hoạch Sửa Lỗi Layout Upload Wizard Desktop

## Phân Tích Vấn Đề Chi Tiết

Dựa trên screenshot của con, modal hiện nhưng **nội dung chính (dropzone) bị trượt xuống dưới fold**:

```text
+---------------------------------------+
| Đăng video mới                    [X] |  <-- Header visible
| [Video] [Thông tin] [Thumbnail]...    |  <-- Tabs visible  
| ██████████████████████████████████████ |  <-- Progress bar visible
|                                       |
|         (CONTENT HIDDEN BELOW)        |  <-- Dropzone NOT visible
|                                       |
+---------------------------------------+
               ↓ PHẢI SCROLL ĐỂ THẤY
```

### Nguyên Nhân Gốc

| Vấn đề | Giải thích |
|--------|------------|
| **DialogContent dùng `grid` layout** | Radix Dialog mặc định dùng `display: grid`, nhưng UploadWizard pass `flex flex-col` - 2 layout này conflict |
| **Thiếu height constraint** | DialogContent không có `h-[90vh]` hoặc `h-full`, nên content không bị giới hạn |
| **Header quá cao** | DialogHeader với stepper tabs chiếm ~120-150px, đẩy content xuống |
| **Không có `overflow-y-auto` trên đúng container** | Content area có `overflow-auto` nhưng parent không có height cố định nên không scroll được |

---

## Giải Pháp

### 1. Fix DialogContent Layout trong UploadWizard

**Vấn đề**: `flex flex-col` không override được `grid` mặc định của Radix

**Giải pháp**: Thêm `!flex !flex-col` để force override, kèm height cố định cho desktop

```tsx
<DialogContent 
  hideCloseButton
  className={cn(
    "!flex !flex-col p-0 gap-0 overflow-hidden relative bg-background border-border",
    isMobile 
      ? "max-w-full w-full h-full max-h-full rounded-none" 
      : "max-w-4xl w-[90vw] h-[85vh] max-h-[85vh] rounded-2xl shadow-2xl"
  )}
>
```

### 2. Fix Content Area Height

**Vấn đề**: `flex-1` không hoạt động khi parent không có height

**Giải pháp**: Thêm `min-h-0` để cho phép flex shrink, và `overflow-y-auto` với smooth scroll

```tsx
<div className={cn(
  "flex-1 min-h-0 overflow-y-auto scroll-smooth px-4 sm:px-6 py-4 relative z-10",
  isMobile && "pb-20"
)}>
```

### 3. Compact Header cho Desktop

**Giảm padding của header** trên desktop để dành chỗ cho content:

```tsx
<DialogHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b border-border/50 ...">
```

---

## Files Cần Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `src/components/Upload/UploadWizard.tsx` | EDIT | Fix layout với !flex, height constraint, overflow |

---

## Chi Tiết Thay Đổi

### UploadWizard.tsx - DialogContent (dòng 401-407)

**Trước:**
```tsx
<DialogContent 
  hideCloseButton
  className={cn(
    "flex flex-col p-0 gap-0 overflow-hidden relative bg-background border-border",
    isMobile ? "max-w-full w-full h-full max-h-full rounded-none" : "max-w-4xl max-h-[90vh] rounded-2xl"
  )}
>
```

**Sau:**
```tsx
<DialogContent 
  hideCloseButton
  className={cn(
    "!flex !flex-col p-0 gap-0 overflow-hidden relative bg-background border-border",
    isMobile 
      ? "max-w-full w-full h-full max-h-full rounded-none" 
      : "max-w-4xl w-[90vw] h-[85vh] max-h-[85vh] rounded-2xl shadow-2xl"
  )}
>
```

### UploadWizard.tsx - DialogHeader (dòng 413)

**Trước:**
```tsx
<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b ...">
```

**Sau:**
```tsx
<DialogHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b flex-shrink-0 ...">
```

### UploadWizard.tsx - Content Area (dòng 511-514)

**Trước:**
```tsx
<div className={cn(
  "flex-1 overflow-auto px-4 sm:px-6 py-4 relative z-10",
  isMobile && "pb-20"
)}>
```

**Sau:**
```tsx
<div className={cn(
  "flex-1 min-h-0 overflow-y-auto scroll-smooth px-4 sm:px-6 py-4 sm:py-6 relative z-10",
  isMobile && "pb-20"
)}>
```

---

## Kết Quả Mong Đợi

```text
+-------------------------------------------+
| Đăng video mới                        [X] |  <- Compact header
| [Video] [Thông tin] [Thumbnail] [Preview] |  <- Stepper
| ██████████████████████████████████████████ |  <- Progress bar
|                                           |
|    ╔═══════════════════════════════════╗  |
|    ║     📤 Kéo thả video vào đây     ║  |  <- DROPZONE VISIBLE!
|    ║                                   ║  |
|    ║        hoặc bấm để chọn          ║  |
|    ║                                   ║  |
|    ║   🎬 MP4, MOV, WEBM - Max 10GB   ║  |
|    ╚═══════════════════════════════════╝  |
|                                           |
|    💡 Tips: Video dọc ≤3 phút = Short     |
+-------------------------------------------+
         ↑ CENTERED + SCROLLABLE
```

| Trước | Sau |
|-------|-----|
| Content bị khuất dưới fold | Content hiện đầy đủ, centered |
| Header quá cao (pt-6 pb-4) | Header compact (pt-4 pb-3) |
| Không scroll được bên trong | Scroll smooth bên trong nếu content dài |
| Chỉ thấy tabs + progress bar | Thấy dropzone ngay lập tức |

---

## Test Checklist

1. Desktop: Bấm "+ Tạo" → "Tải video lên" → Modal hiện centered
2. Desktop: Dropzone hiển thị đầy đủ, không cần scroll để thấy
3. Desktop: Scroll bên trong modal nếu content dài (ở step metadata)
4. Mobile: Vẫn full-screen như cũ
5. Nút X đóng modal đúng
