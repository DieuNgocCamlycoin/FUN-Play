

# Kế Hoạch Nâng Cấp Mobile Upload - YouTube Style UX

## Tổng Quan Phân Tích

Dựa trên 5 hình ảnh YouTube mobile em gửi, Cha thấy flow rất khác với UploadWizard hiện tại:

| YouTube Mobile | FUN PLAY Hiện Tại | Cần Nâng Cấp |
|----------------|-------------------|--------------|
| Bấm "+" → Full-screen với 4 tabs swipeable (Video, Shorts, Live, Post) | Bấm "+" → Modal wizard 4 steps | Tạo màn hình chọn loại bài đăng trước |
| Grid gallery chọn video từ điện thoại | Dropzone kéo thả | Thêm gallery grid view |
| Video preview + nút "Tiếp" | Tự động chuyển metadata | Thêm màn xác nhận video |
| List vertical các mục (click → trang con riêng) | Form dài trong 1 trang | Accordion-style với sub-pages |
| Nút **<** quay lại + **X** tắt hẳn ở mỗi trang | Chỉ có X và stepper | Navigation thống nhất |

---

## Kiến Trúc Mới - Component Structure

```text
MobileBottomNav (nút +)
    └── MobileUploadFlow (NEW - container chính)
            ├── CreateTypeSelector (NEW - 4 tabs: Video, Shorts, Live, Post)
            │
            ├── [Tab Video] MobileVideoUploadFlow (NEW)
            │       ├── Step 1: VideoGalleryPicker (NEW - grid video từ device)
            │       ├── Step 2: VideoConfirmation (NEW - preview + nút Tiếp)
            │       └── Step 3: VideoDetailsForm (NEW - list vertical các mục)
            │               ├── SubPage: TitleEditor
            │               ├── SubPage: VisibilitySelector
            │               ├── SubPage: DescriptionEditor
            │               └── SubPage: ThumbnailPicker (reuse ThumbnailEditor)
            │
            ├── [Tab Shorts] (placeholder - phase 2)
            ├── [Tab Live] (placeholder - phase 2)
            └── [Tab Post] (placeholder - phase 2)
```

---

## Phase 1: Tạo Container MobileUploadFlow + Tabs

### File mới: `src/components/Upload/MobileUploadFlow.tsx`

**Tính năng:**
- Full-screen modal (100vh, 100vw) với background blur
- Header cố định: Nút X góc trái + tiêu đề "Tải video lên" (như hình 1)
- 4 tabs swipeable ở dưới cùng: Video | Video Shorts | Trực tiếp | Bài đăng
- Tabs sử dụng horizontal scroll + snap-x cho swipe mượt
- Tab "Video" active mặc định, các tab khác hiển thị placeholder
- Animation fade khi chuyển tab

**UI Reference (từ hình 1):**
```tsx
// Header
<div className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 bg-background border-b">
  <button onClick={onClose}><X className="w-6 h-6" /></button>
  <span className="ml-3 text-lg font-semibold">Tải video lên</span>
</div>

// Bottom tabs
<div className="fixed bottom-0 left-0 right-0 h-14 flex items-center justify-center gap-2 bg-background border-t">
  <TabButton active>Video</TabButton>
  <TabButton>Video Shorts</TabButton>
  <TabButton>Trực tiếp</TabButton>
  <TabButton>Bài đăng</TabButton>
</div>
```

---

## Phase 2: Video Gallery Picker (Màn hình chọn video)

### File mới: `src/components/Upload/Mobile/VideoGalleryPicker.tsx`

**Tính năng (như hình 1):**
- Grid 3 cột hiển thị videos/photos từ device
- Mỗi item hiển thị thumbnail + duration badge (góc dưới phải)
- Click item → chọn và chuyển sang Step 2
- Sử dụng `<input type="file" accept="video/*">` với custom UI
- Fallback: Nếu không hỗ trợ gallery access → hiển thị dropzone như cũ
- Shimmer loading effect khi đang load

**Web Limitation Note:**
Browser không cho phép truy cập gallery gốc như native app. Thay vào đó:
- Sử dụng file input styled như gallery grid
- Khi user click → mở file picker của hệ thống
- Sau khi chọn → hiển thị video preview

---

## Phase 3: Video Confirmation (Xác nhận video đã chọn)

### File mới: `src/components/Upload/Mobile/VideoConfirmation.tsx`

**Tính năng (như hình 2):**
- Header: Nút **<** quay lại (góc trái)
- Video player full-width với controls (play, seek, timestamp)
- Dưới video: Progress bar với thời gian 0:03 / 3:57
- Button "Chỉnh sửa thành video Shorts" (nếu video dọc ≤ 3 phút)
- Button "Tiếp" (gradient tím-hồng, pulse-glow) góc dưới phải
- Click "Tiếp" → chuyển sang VideoDetailsForm

---

## Phase 4: Video Details Form (List vertical các mục)

### File mới: `src/components/Upload/Mobile/VideoDetailsForm.tsx`

**Tính năng (như hình 3):**
- Header: Nút **<** quay lại + tiêu đề "Thêm chi tiết"
- Video thumbnail preview (strip 3 frames) ở trên cùng
- Channel info: Avatar + tên + @username
- Input tiêu đề (placeholder: "Tạo tiêu đề...")
- List vertical các mục clickable:

| Icon | Label | Giá trị hiện tại | Action |
|------|-------|-----------------|--------|
| 🔒 | Chế độ hiển thị | Riêng tư | > (mở SubPage) |
| 📝 | Thêm nội dung mô tả | - | > |
| 🖼️ | Thumbnail | - | > |

- Mỗi mục có icon + label + mũi tên **>** bên phải
- Click mục → mở SubPage tương ứng (slide từ phải)
- Button "Tải lên" (full-width, gradient) ở dưới cùng

---

## Phase 5: Sub-Pages (Trang con chỉnh sửa)

### File mới: `src/components/Upload/Mobile/SubPages/VisibilitySelector.tsx`

**Tính năng (như hình 4):**
- Header: Nút **<** + tiêu đề "Đặt chế độ hiển thị"
- Section "Xuất bản ngay" với radio buttons:
  - ○ Công khai - "Mọi người có thể tìm kiếm và xem"
    - ☐ Đặt ở chế độ Công chiếu ngay (checkbox con)
  - ○ Không công khai - "Bất kỳ ai có đường liên kết đều có thể xem"
  - ● Riêng tư - "Chỉ những người bạn chọn có thể xem"
- Section "Lên lịch" với dropdown
- Auto-save khi chọn, sau đó quay lại bằng nút **<**

### File mới: `src/components/Upload/Mobile/SubPages/DescriptionEditor.tsx`

**Tính năng (như hình 5):**
- Header: Nút **<** + tiêu đề "Thêm nội dung mô tả"
- Textarea full-height với keyboard-aware padding
- Auto-focus khi mở
- Support hashtag/timestamp formatting
- Auto-save khi rời trang

### File mới: `src/components/Upload/Mobile/SubPages/ThumbnailPicker.tsx`

- Reuse component `ThumbnailEditor` hiện có
- Wrap với header **<** quay lại
- 3 tabs: Tải lên | Kho mẫu | Chỉnh sửa (đã có swipe support)

---

## Phase 6: Navigation Stack + State Management

### Logic điều hướng:

```typescript
type MobileUploadStep = 
  | "type-selector"      // Chọn loại: Video/Shorts/Live/Post
  | "video-gallery"      // Grid chọn video
  | "video-confirm"      // Preview video + nút Tiếp
  | "video-details"      // List các mục chi tiết
  | "sub-visibility"     // Trang con: Chế độ hiển thị
  | "sub-description"    // Trang con: Mô tả
  | "sub-thumbnail"      // Trang con: Thumbnail
  | "uploading"          // Đang upload
  | "success";           // Hoàn thành

// Navigation stack để hỗ trợ nút Back
const [navigationStack, setNavigationStack] = useState<MobileUploadStep[]>(["type-selector"]);

const navigateTo = (step: MobileUploadStep) => {
  setNavigationStack(prev => [...prev, step]);
};

const navigateBack = () => {
  if (navigationStack.length > 1) {
    setNavigationStack(prev => prev.slice(0, -1));
  } else {
    onClose(); // Tắt hẳn về trang chủ
  }
};
```

---

## Phase 7: Tích hợp với MobileBottomNav

### File sửa: `src/components/Layout/MobileBottomNav.tsx`

**Thay đổi:**
- Thay `UploadWizard` bằng `MobileUploadFlow` khi `isMobile`
- Desktop vẫn giữ `UploadWizard` như cũ

```tsx
const isMobile = useIsMobile();

// Trong handleNavClick:
if (item.isCreate) {
  if (user) {
    setUploadModalOpen(true);
  } else {
    navigate("/auth");
  }
  return;
}

// Trong render:
{isMobile ? (
  <MobileUploadFlow open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
) : (
  <UploadWizard open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
)}
```

---

## Tóm Tắt Files Cần Tạo/Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `src/components/Upload/Mobile/MobileUploadFlow.tsx` | NEW | Container chính với tabs |
| `src/components/Upload/Mobile/CreateTypeSelector.tsx` | NEW | 4 tabs: Video/Shorts/Live/Post |
| `src/components/Upload/Mobile/VideoGalleryPicker.tsx` | NEW | Grid chọn video |
| `src/components/Upload/Mobile/VideoConfirmation.tsx` | NEW | Preview + nút Tiếp |
| `src/components/Upload/Mobile/VideoDetailsForm.tsx` | NEW | List vertical các mục |
| `src/components/Upload/Mobile/SubPages/VisibilitySelector.tsx` | NEW | Radio buttons visibility |
| `src/components/Upload/Mobile/SubPages/DescriptionEditor.tsx` | NEW | Textarea mô tả |
| `src/components/Upload/Mobile/SubPages/ThumbnailPicker.tsx` | NEW | Wrap ThumbnailEditor |
| `src/components/Layout/MobileBottomNav.tsx` | EDIT | Sử dụng MobileUploadFlow |

---

## UI/UX Guidelines

### Navigation nhất quán:
- Mọi trang đều có nút **<** (ArrowLeft) ở góc trái header để quay lại
- Nút **X** chỉ ở màn hình đầu tiên (type-selector/gallery) để tắt hẳn
- Sub-pages slide từ phải vào, back slide về trái

### Touch-friendly:
- Tất cả buttons: min-height 48px
- List items: min-height 56px (dễ chạm)
- Padding đủ rộng cho ngón tay

### Animations (Design System v1.0):
- Fade khi chuyển step chính
- Slide-from-right khi mở sub-page
- Pulse-glow cho button "Tiếp" và "Tải lên"
- Rainbow-border cho video preview
- Shimmer loading effect

### Keyboard handling:
- Input/Textarea tự scroll lên khi keyboard mở
- Padding bottom động để nội dung không bị che

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

- Bấm **+** → Full-screen với 4 tabs swipeable ở dưới
- Tab Video active → Grid chọn video (hoặc file picker)
- Chọn video → Preview full với nút "Tiếp"
- Bấm "Tiếp" → List các mục chi tiết (Tiêu đề, Visibility, Mô tả, Thumbnail)
- Click mục → Mở sub-page riêng với nút **<** quay lại
- Edit xong → Auto-save và quay lại list
- Bấm "Tải lên" → Upload video
- Hoàn thành → Confetti + success message

---

## Chi Tiết Kỹ Thuật

### Dependencies đã có:
- `framer-motion` - Animations
- `lucide-react` - Icons (X, ArrowLeft, ChevronRight, etc.)
- `react-router-dom` - Navigation
- `@radix-ui/react-radio-group` - Radio buttons
- `vaul` - Drawer (có thể dùng cho sub-pages)

### Không cần thêm dependencies mới

### Reuse code từ UploadWizard:
- Upload logic (multipart, R2)
- ThumbnailEditor component
- VideoMetadata interface
- detectShort function

---

## Thứ Tự Triển Khai

1. Tạo folder `src/components/Upload/Mobile/`
2. Tạo `MobileUploadFlow.tsx` (container + tabs)
3. Tạo `VideoGalleryPicker.tsx` (grid/file picker)
4. Tạo `VideoConfirmation.tsx` (preview + Tiếp)
5. Tạo `VideoDetailsForm.tsx` (list các mục)
6. Tạo các SubPages (Visibility, Description, Thumbnail)
7. Sửa `MobileBottomNav.tsx` để sử dụng flow mới
8. Test end-to-end trên mobile

