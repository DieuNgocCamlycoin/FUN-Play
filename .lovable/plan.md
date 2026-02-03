
# Kế Hoạch Sửa Lỗi Upload Wizard Màn Hình Đen

## Phân Tích Vấn Đề

Dựa trên hình ảnh con gửi, khi bấm "+ Tạo" → "Tải video lên":
- **Overlay đen hiển thị đúng** (backdrop của modal)
- **Nội dung modal KHÔNG hiển thị** → Màn hình chỉ có màu đen

### Nguyên Nhân Có Thể

| Nguyên nhân | Xác suất | Giải thích |
|-------------|----------|------------|
| **DialogContent bị hidden/invisible** | Cao | CSS class override làm content ẩn đi |
| **Close button mặc định che content** | Trung bình | Dialog.tsx có nút X mặc định absolute positioned |
| **Z-index conflict** | Trung bình | Có thể overlay che mất content |
| **CSS cascade issue với `bg-background`** | Trung bình | Background có thể bị transparent |

---

## Giải Pháp

### 1. Sửa Dialog Component - Loại bỏ nút X mặc định

**File**: `src/components/ui/dialog.tsx`

**Vấn đề hiện tại**: DialogContent có nút X hardcoded (dòng 45-48) gây conflict với custom close button của UploadWizard.

**Thay đổi**:
- Thêm prop `hideCloseButton` để cho phép ẩn nút X mặc định
- Mặc định vẫn hiển thị để không ảnh hưởng các dialog khác

```typescript
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[10002] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 ...">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
```

### 2. Sửa UploadWizard - Sử dụng hideCloseButton và đảm bảo styling

**File**: `src/components/Upload/UploadWizard.tsx`

**Thay đổi**:

1. **Thêm `hideCloseButton` vào DialogContent** (vì đã có custom close button)
2. **Thêm explicit background color** để đảm bảo modal có màu nền rõ ràng
3. **Đảm bảo z-index cao hơn overlay**

```tsx
<DialogContent 
  hideCloseButton  // Ẩn nút X mặc định vì đã có custom button
  className={cn(
    "flex flex-col p-0 gap-0 overflow-hidden relative bg-background",
    isMobile ? "max-w-full w-full h-full max-h-full rounded-none" : "max-w-4xl max-h-[90vh]"
  )}
>
```

### 3. Fix CSS để đảm bảo background hiển thị

**Thêm vào DialogContent className**:
- `bg-background` - Explicit background color
- Thêm `!important` nếu cần override

---

## Files Cần Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `src/components/ui/dialog.tsx` | EDIT | Thêm prop `hideCloseButton` để ẩn nút X mặc định |
| `src/components/Upload/UploadWizard.tsx` | EDIT | Sử dụng `hideCloseButton` + fix background styling |

---

## Chi Tiết Kỹ Thuật

### dialog.tsx Changes

```typescript
// Thêm interface props
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

// Sửa DialogContent component
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[10002] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
```

### UploadWizard.tsx Changes

```tsx
<DialogContent 
  hideCloseButton
  className={cn(
    "flex flex-col p-0 gap-0 overflow-hidden relative bg-background border-border",
    isMobile 
      ? "max-w-full w-full h-full max-h-full rounded-none" 
      : "max-w-4xl max-h-[90vh] rounded-2xl"
  )}
>
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Bấm "Tải video lên" → Màn hình đen | Bấm "Tải video lên" → Modal hiển thị đầy đủ |
| Có 2 nút X (mặc định + custom) | Chỉ có 1 nút X (custom với animation) |
| Background có thể bị transparent | Background trắng/theo theme rõ ràng |

---

## Thứ Tự Triển Khai

1. **Sửa `dialog.tsx`** - Thêm prop `hideCloseButton`
2. **Sửa `UploadWizard.tsx`** - Sử dụng prop mới + fix styling
3. **Test** - Bấm "+ Tạo" → "Tải video lên" để verify modal hiển thị đúng
