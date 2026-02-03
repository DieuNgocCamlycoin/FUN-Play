

# Kế Hoạch Triển Khai Nâng Cấp Upload Wizard - Smart Navigation & YouTube-Style UX

## Tổng Quan Phân Tích Hiện Tại

Upload Wizard hiện tại đã hoạt động tốt với 5 bước và Design System v1.0. Tuy nhiên, cần nâng cấp để mượt mà hơn, trí tuệ hơn và giống YouTube Studio hơn:

| Tính năng | Hiện tại | Cần nâng cấp |
|-----------|----------|--------------|
| **Stepper** | Chỉ hiển thị trạng thái | Clickable để quay lại step bất kỳ |
| **Nút X đóng** | Không có | Thêm X ở header + confirm dialog |
| **Labels clickable** | Labels tĩnh | Click để focus field + scroll |
| **Edit từ Preview** | Không có | Click metadata để quay lại edit |
| **Mobile UX** | Cơ bản | Swipeable stepper, accordion-style form |

---

## Phase 1: Clickable Step Indicator (Stepper)

### File: `src/components/Upload/UploadWizard.tsx`

**Thêm logic navigation:**

```typescript
// Thêm function kiểm tra có thể navigate đến step hay không
const canNavigateToStep = (targetStep: Step): boolean => {
  const stepOrder = ["upload", "metadata", "thumbnail", "preview"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep as string);
  
  // Chỉ cho phép quay lại steps trước đó khi đã có video
  return targetIndex <= currentIndex && videoFile !== null;
};

// Thêm function xử lý click step
const handleStepClick = (stepId: string) => {
  const targetStep = stepId as Step;
  if (canNavigateToStep(targetStep)) {
    setCurrentStep(targetStep);
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  }
};
```

**Nâng cấp UI stepper (dòng 396-433):**
- Thêm `onClick={() => handleStepClick(step.id)}` cho completed steps
- Thêm `cursor-pointer` và hover effect `hover:shadow-[0_0_20px_hsl(var(--cosmic-cyan)/0.5)]`
- Thêm `title` tooltip "Nhấn để chỉnh sửa [label] ✨"
- Animation `whileHover={{ scale: 1.08 }}` và `whileTap={{ scale: 0.95 }}`
- Mobile: Container có `overflow-x-auto snap-x snap-mandatory` cho swipeable

---

## Phase 2: Nút X Đóng Modal + Confirm Dialog

### File: `src/components/Upload/UploadWizard.tsx`

**Thêm state và handlers:**

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

**Thêm nút X vào header (sau DialogTitle):**

```tsx
<motion.button
  whileHover={{ scale: 1.1, rotate: 90 }}
  whileTap={{ scale: 0.9 }}
  onClick={handleCloseClick}
  className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-destructive/20 hover:text-destructive transition-all"
  title="Tắt & quay về trang chủ"
>
  <X className="w-4 h-4" />
</motion.button>
```

**Thêm Confirm Dialog component (trước closing tag `</Dialog>`):**

```tsx
<AnimatePresence>
  {showCloseConfirm && (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div className="bg-background/95 backdrop-blur-xl border border-[hsl(var(--cosmic-cyan)/0.3)] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
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
            <Button variant="outline" onClick={() => setShowCloseConfirm(false)} className="flex-1 min-h-[44px]">
              Tiếp tục đăng
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose} className="flex-1 min-h-[44px]">
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

## Phase 3: Clickable Labels/Tiêu Đề + Edit từ Preview

### File: `src/components/Upload/UploadMetadataForm.tsx`

**Nâng cấp labels thành clickable buttons:**

```tsx
{/* Title - clickable label */}
<div className="space-y-2">
  <button
    type="button"
    onClick={() => {
      document.getElementById("title")?.focus();
      document.getElementById("title")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }}
    className="text-base font-semibold flex items-center gap-2 hover:text-[hsl(var(--cosmic-cyan))] transition-colors group"
  >
    Tiêu đề <span className="text-destructive">*</span>
    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
      ✏️
    </span>
  </button>
  {/* Input giữ nguyên */}
</div>
```

**Áp dụng tương tự cho: Mô tả, Tags, Quyền riêng tư**

### File: `src/components/Upload/UploadPreview.tsx`

**Thêm props cho edit callbacks:**

```tsx
interface UploadPreviewProps {
  // ... existing props
  onEditMetadata?: () => void;
  onEditThumbnail?: () => void;
}
```

**Làm metadata sections clickable:**

```tsx
<div 
  onClick={onEditMetadata}
  className="cursor-pointer hover:bg-[hsl(var(--cosmic-cyan)/0.05)] rounded-lg p-2 -m-2 transition-colors group"
>
  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
    Tiêu đề
    <span className="opacity-0 group-hover:opacity-100 text-[hsl(var(--cosmic-cyan))] transition-opacity text-[10px]">
      ✏️ Chỉnh sửa
    </span>
  </p>
  <p className="font-bold text-lg">{metadata.title || "Chưa có tiêu đề"}</p>
</div>
```

**Tương tự cho: Mô tả, Tags, Thumbnail preview**

### File: `src/components/Upload/UploadWizard.tsx`

**Cập nhật UploadPreview với callbacks (dòng 473-482):**

```tsx
<UploadPreview
  videoPreviewUrl={videoPreviewUrl}
  thumbnailPreview={thumbnailPreview}
  metadata={metadata}
  isShort={isShort}
  onPublish={handleUpload}
  onBack={() => setCurrentStep("thumbnail")}
  onEditMetadata={() => setCurrentStep("metadata")}
  onEditThumbnail={() => setCurrentStep("thumbnail")}
/>
```

---

## Phase 4: Nâng Cấp Animations & Effects

### File: `src/index.css`

**Thêm animation mới:**

```css
/* Rainbow click pulse cho stepper */
@keyframes rainbow-click-pulse {
  0% { box-shadow: 0 0 0 0 hsl(var(--cosmic-cyan) / 0.7); }
  50% { box-shadow: 0 0 0 8px hsl(var(--cosmic-magenta) / 0.3); }
  100% { box-shadow: 0 0 0 16px transparent; }
}

.rainbow-click {
  animation: rainbow-click-pulse 0.4s ease-out;
}

/* Shimmer animation cho loading states */
@keyframes shimmer-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer-slide {
  animation: shimmer-slide 1.5s ease-in-out infinite;
}
```

### File: `src/components/Upload/UploadWizard.tsx`

**Thêm holographic border cho modal:**

```tsx
<DialogContent className="... relative overflow-hidden">
  {/* Holographic border effect */}
  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-10 -z-10" />
  {/* Content */}
</DialogContent>
```

**Pulse-halo cho navigation buttons:**

```tsx
<Button className="... relative overflow-hidden">
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

---

## Phase 5: Mobile Optimizations

### File: `src/components/Upload/UploadWizard.tsx`

**Stepper horizontal swipeable:**

```tsx
<div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-2">
  {STEPS.map((step, index) => (
    <div key={step.id} className="flex items-center flex-shrink-0 snap-center">
      {/* Step indicator with touch-friendly size */}
      <motion.div
        onClick={() => handleStepClick(step.id)}
        className="... min-w-[80px] sm:min-w-[100px] min-h-[44px] ..."
      >
        {/* content */}
      </motion.div>
    </div>
  ))}
</div>
```

**Touch-friendly buttons (đảm bảo tất cả có min-height 48px):**

```tsx
<Button className="min-h-[48px] px-6 active:scale-95 transition-transform touch-manipulation">
```

### File: `src/components/Upload/ThumbnailEditor.tsx`

**Thêm swipe gesture cho tabs:**

```tsx
// Thêm touch swipe handler
const [touchStart, setTouchStart] = useState(0);
const tabOrder = ["upload", "gallery", "editor"];

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.touches[0].clientX);
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const touchEnd = e.changedTouches[0].clientX;
  const diff = touchStart - touchEnd;
  const currentIndex = tabOrder.indexOf(activeTab);
  
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (diff < 0 && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  }
};
```

---

## Tóm Tắt Files Cần Sửa

| File | Thay đổi | Dòng ảnh hưởng |
|------|----------|----------------|
| `UploadWizard.tsx` | Clickable stepper, X button, confirm dialog, holographic border | 1-555 (nhiều sections) |
| `UploadMetadataForm.tsx` | Clickable labels với focus/scroll | 106-156 (labels sections) |
| `UploadPreview.tsx` | Thêm edit callbacks, clickable metadata sections | 10-17 (props), 111-175 (content) |
| `UploadSuccess.tsx` | Nhỏ - đảm bảo X button trong callbacks hoạt động | Không đổi nhiều |
| `ThumbnailEditor.tsx` | Swipe gesture cho tabs | 27-30 (state), 150-200 (tabs) |
| `index.css` | Thêm rainbow-click-pulse animation | Cuối file |

---

## Chi Tiết Kỹ Thuật

### Dependencies đã có (không cần cài thêm):
- `framer-motion` ✅ - Animations
- `lucide-react` ✅ - Icons (X, Sparkles, etc.)
- `react-router-dom` ✅ - navigate()
- `@radix-ui/react-dialog` ✅ - Modal

### Import cần thêm vào UploadWizard.tsx:
```typescript
import { X } from "lucide-react"; // Thêm X icon
```

### Import cần thêm vào UploadPreview.tsx:
```typescript
import { Edit3 } from "lucide-react"; // Optional: icon edit
```

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

- ✅ **Stepper clickable**: Click vào bất kỳ step đã hoàn thành để quay lại edit
- ✅ **Nút X đóng**: Ở góc phải header với tooltip, confirm dialog vui vẻ
- ✅ **Labels clickable**: Click tiêu đề để focus input + scroll mượt
- ✅ **Edit từ Preview**: Click metadata để quay lại step tương ứng
- ✅ **Rainbow-glow animation**: Khi click stepper
- ✅ **Pulse-halo effect**: Cho navigation buttons
- ✅ **Holographic border**: Cho toàn modal
- ✅ **Mobile swipeable**: Stepper và tabs thumbnail
- ✅ **Touch-friendly**: Min 48px buttons, haptic feedback

---

## Thứ Tự Triển Khai

1. **UploadWizard.tsx**: Clickable stepper + X button + confirm dialog + holographic border
2. **UploadMetadataForm.tsx**: Clickable labels
3. **UploadPreview.tsx**: Edit callbacks + clickable sections
4. **ThumbnailEditor.tsx**: Swipe gesture cho tabs
5. **index.css**: Animation keyframes
6. **Test end-to-end**: Mobile + desktop

