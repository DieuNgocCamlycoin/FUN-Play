

# Kế Hoạch Nâng Cấp Upload Wizard - Navigation Thông Minh & UX Mượt Mà

## Tổng Quan Phân Tích Hiện Tại

Từ screenshots và code, Cha thấy Upload Wizard đã hoạt động tốt với 5 bước và Design System v1.0. Tuy nhiên, còn thiếu:

| Thiếu | Hiện tại | Cần nâng cấp |
|-------|----------|--------------|
| **Stepper clickable** | Chỉ hiển thị trạng thái, không click được | Click vào bất kỳ step đã hoàn thành để quay lại edit |
| **Nút X đóng** | Không có nút X riêng | Thêm X ở header phải với confirm dialog |
| **Confirm hủy** | Đóng modal không cảnh báo | Dialog vui vẻ "Bạn chắc chắn muốn hủy không? Ánh sáng đang chờ lan tỏa!" |
| **Tiêu đề clickable** | Labels không tương tác | Click tiêu đề để focus/scroll đến field đó |

---

## Phase 1: Clickable Step Indicator (Ưu Tiên Cao)

### File: `UploadWizard.tsx`

**Thay đổi trong stepper:**

```text
Hiện tại (dòng 401-421):
- motion.div không có onClick
- Chỉ hiển thị trạng thái active/completed

Nâng cấp:
- Thêm onClick={() => handleStepClick(step.id)} cho completed steps
- Thêm cursor-pointer và hover effect rainbow-glow
- Animation pulse khi click
- Chỉ cho phép click vào steps đã hoàn thành (validated)
```

**Logic mới:**

```typescript
const canNavigateToStep = (targetStep: Step): boolean => {
  const stepOrder = ["upload", "metadata", "thumbnail", "preview"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);
  
  // Có thể quay lại bất kỳ step trước đó
  // Chỉ cần có video file là có thể navigate
  if (targetIndex <= currentIndex && videoFile) {
    return true;
  }
  return false;
};

const handleStepClick = (stepId: string) => {
  const targetStep = stepId as Step;
  if (canNavigateToStep(targetStep)) {
    setCurrentStep(targetStep);
    // Haptic feedback nếu có
    if (navigator.vibrate) navigator.vibrate(50);
  }
};
```

**UI nâng cấp stepper:**

```tsx
<motion.div
  onClick={() => handleStepClick(step.id)}
  whileHover={isCompleted ? { scale: 1.08 } : {}}
  whileTap={isCompleted ? { scale: 0.95 } : {}}
  className={cn(
    "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-300",
    isActive && "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white shadow-lg",
    isCompleted && "bg-[hsl(var(--cosmic-cyan)/0.2)] text-[hsl(var(--cosmic-cyan))] cursor-pointer hover:shadow-[0_0_20px_hsl(var(--cosmic-cyan)/0.5)]",
    !isActive && !isCompleted && "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
  )}
  title={isCompleted ? `Nhấn để chỉnh sửa ${step.label}` : ""}
>
```

---

## Phase 2: Nút X Đóng Modal + Confirm Dialog (Ưu Tiên Cao)

### File: `UploadWizard.tsx`

**Thêm state cho confirm dialog:**

```typescript
const [showCloseConfirm, setShowCloseConfirm] = useState(false);

// Kiểm tra có dữ liệu chưa lưu
const hasUnsavedData = videoFile !== null || metadata.title.trim() !== "";

// Xử lý click X
const handleCloseClick = () => {
  if (hasUnsavedData && currentStep !== "success") {
    setShowCloseConfirm(true);
  } else {
    handleClose();
    navigate("/");
  }
};

// Xác nhận đóng
const handleConfirmClose = () => {
  setShowCloseConfirm(false);
  handleClose();
  navigate("/");
};
```

**Thêm nút X vào header (bên cạnh tiêu đề):**

```tsx
<div className="flex items-center justify-between gap-2">
  <DialogTitle className="...">
    {/* ... existing title */}
  </DialogTitle>
  
  <div className="flex items-center gap-2">
    {isShort && /* SHORT badge */}
    
    {/* Nút X đóng */}
    <motion.button
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleCloseClick}
      className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-destructive/20 hover:text-destructive transition-all"
      title="Tắt & quay về trang chủ"
    >
      <X className="w-4 h-4" />
    </motion.button>
  </div>
</div>
```

**Confirm Dialog vui vẻ (glass-card style):**

```tsx
{/* Close Confirmation Dialog */}
<AnimatePresence>
  {showCloseConfirm && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setShowCloseConfirm(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background/95 backdrop-blur-xl border border-[hsl(var(--cosmic-cyan)/0.3)] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.2)] to-[hsl(var(--cosmic-magenta)/0.2)] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[hsl(var(--cosmic-gold))]" />
          </div>
          <h3 className="text-lg font-bold">Chờ đã! ✨</h3>
          <p className="text-muted-foreground text-sm">
            Bạn chắc chắn muốn hủy không?<br/>
            Ánh sáng của bạn đang chờ lan tỏa đấy! 💕
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCloseConfirm(false)}
              className="flex-1 min-h-[44px]"
            >
              Tiếp tục đăng
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClose}
              className="flex-1 min-h-[44px]"
            >
              Hủy bỏ
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## Phase 3: Clickable Labels/Tiêu Đề Trong Form (Trung Bình)

### File: `UploadMetadataForm.tsx`

**Nâng cấp labels thành clickable:**

```tsx
{/* Title - clickable label */}
<div className="space-y-2">
  <button
    type="button"
    onClick={() => document.getElementById("title")?.focus()}
    className="text-base font-semibold flex items-center gap-2 hover:text-[hsl(var(--cosmic-cyan))] transition-colors group"
  >
    Tiêu đề <span className="text-destructive">*</span>
    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
      (nhấn để chỉnh sửa)
    </span>
  </button>
  {/* Input remains same */}
</div>
```

### File: `UploadPreview.tsx`

**Thêm tính năng click metadata để quay lại edit:**

```tsx
interface UploadPreviewProps {
  // ... existing props
  onEditMetadata?: () => void;
  onEditThumbnail?: () => void;
}

// Trong metadata section:
<div 
  onClick={onEditMetadata}
  className="cursor-pointer hover:bg-[hsl(var(--cosmic-cyan)/0.05)] rounded-lg p-2 -m-2 transition-colors group"
>
  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
    Tiêu đề
    <span className="opacity-0 group-hover:opacity-100 text-[hsl(var(--cosmic-cyan))] transition-opacity">
      ✏️ Chỉnh sửa
    </span>
  </p>
  <p className="font-bold text-lg">{metadata.title || "Chưa có tiêu đề"}</p>
</div>
```

---

## Phase 4: Nâng Cấp Animations & Effects (Trung Bình)

### Toàn bộ components Upload

**Rainbow-glow animation khi click stepper:**

```css
/* Thêm vào index.css hoặc component */
@keyframes rainbow-click-pulse {
  0% { box-shadow: 0 0 0 0 hsl(var(--cosmic-cyan) / 0.7); }
  50% { box-shadow: 0 0 0 8px hsl(var(--cosmic-magenta) / 0.3); }
  100% { box-shadow: 0 0 0 16px transparent; }
}

.rainbow-click {
  animation: rainbow-click-pulse 0.4s ease-out;
}
```

**Pulse-halo cho navigation buttons:**

```tsx
<Button className="... relative overflow-hidden">
  {/* Pulse halo effect */}
  <motion.span
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    initial={{ x: "-100%" }}
    whileHover={{ x: "100%" }}
    transition={{ duration: 0.5 }}
  />
  Tiếp tục
  <ArrowRight className="w-4 h-4" />
</Button>
```

**Holographic border cho modal:**

```tsx
<DialogContent className="... relative">
  {/* Holographic border effect */}
  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-20 -z-10 blur-sm animate-rainbow-border" />
  {/* ... content */}
</DialogContent>
```

---

## Phase 5: Mobile Optimizations (Trung Bình)

### Stepper horizontal swipeable

```tsx
{/* Mobile: horizontal scroll với snap */}
<div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
  {STEPS.map((step, index) => (
    <div key={step.id} className="flex items-center flex-shrink-0 snap-center">
      {/* step content */}
    </div>
  ))}
</div>
```

### Touch-friendly buttons

```tsx
{/* Đảm bảo tất cả buttons có min-height 48px */}
<Button className="min-h-[48px] px-6 active:scale-95 transition-transform">
```

---

## Tóm Tắt Files Cần Sửa

| File | Thay đổi | Priority |
|------|----------|----------|
| `UploadWizard.tsx` | Clickable stepper, X button, confirm dialog, holographic border | Cao |
| `UploadMetadataForm.tsx` | Clickable labels | Trung bình |
| `UploadPreview.tsx` | onClick props để edit metadata/thumbnail | Trung bình |
| `UploadSuccess.tsx` | Đảm bảo X button hoạt động mượt | Thấp |

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:
- ✅ Click vào bất kỳ step đã hoàn thành để quay lại chỉnh sửa (YouTube-like)
- ✅ Nút X ở góc phải header với tooltip "Tắt & quay về trang chủ"
- ✅ Confirm dialog vui vẻ khi hủy (glass-card với emoji ✨💕)
- ✅ Rainbow-glow animation khi click stepper
- ✅ Pulse-halo effect cho navigation buttons
- ✅ Holographic border cho toàn modal
- ✅ Mobile stepper swipeable horizontally
- ✅ Touch-friendly với min 48px buttons

---

## Chi Tiết Kỹ Thuật

### Dependencies đã có:
- `framer-motion` ✅ (animations)
- `lucide-react` ✅ (icons including X)
- `react-router-dom` ✅ (navigate)

### Không cần thêm dependencies mới

### Thời gian ước tính:
- Phase 1-2 (Stepper + X button): ~1 session
- Phase 3-4 (Labels + Animations): ~1 session
- Phase 5 (Mobile): ~0.5 session

