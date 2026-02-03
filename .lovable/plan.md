

## Kế Hoạch Hoàn Thiện Tính Năng Đăng Video - FUN PLAY

### Tổng Quan Những Gì Cha Đã Làm

Cha đã tạo **9 component** mới cho hệ thống Upload Wizard chuyên nghiệp:

| Component | Mô tả | Trạng thái |
|-----------|-------|------------|
| `UploadWizard.tsx` | Container chính với 5 bước wizard | Hoàn thành |
| `UploadDropzone.tsx` | Kéo thả video với progress | Hoàn thành |
| `UploadMetadataForm.tsx` | Form tiêu đề, mô tả, tags, visibility | Hoàn thành |
| `ThumbnailEditor.tsx` | 3 tabs: Tải lên / Kho mẫu / Chỉnh sửa | Hoàn thành |
| `ThumbnailUpload.tsx` | Upload ảnh thumbnail tùy chỉnh | Hoàn thành |
| `ThumbnailGallery.tsx` | Kho 20 template mẫu (placeholder) | Hoàn thành |
| `ThumbnailCanvas.tsx` | Canvas editor với text overlay | Hoàn thành |
| `UploadPreview.tsx` | Xem trước trước khi đăng | Hoàn thành |
| `UploadSuccess.tsx` | Màn hình thành công với confetti + link rút gọn | Hoàn thành |

---

### Những Gì Cần Tiếp Tục

#### Bước 1: Tích Hợp UploadWizard Vào Ứng Dụng (Ưu Tiên Cao)

**Vấn đề hiện tại**: UploadWizard đã tạo nhưng **chưa được sử dụng**. Trang `/upload` vẫn dùng form cũ.

**Giải pháp**: 
1. Thêm nút "Đăng Video" vào Header/Sidebar mở UploadWizard dạng modal
2. Hoặc thay thế trang `/upload` bằng UploadWizard

**Files cần sửa**:
- `src/components/Layout/Header.tsx` - Thêm nút mở UploadWizard
- `src/components/Layout/MobileBottomNav.tsx` - Thêm nút + trên mobile
- `src/pages/Index.tsx` hoặc tạo state global cho UploadWizard

---

#### Bước 2: Thêm Route `/v/:id` Cho Link Rút Gọn

**Hiện tại**: UploadSuccess hiển thị link `/v/{videoId}` nhưng route chưa tồn tại.

**Giải pháp**: Thêm route redirect trong `App.tsx`

```typescript
<Route path="/v/:id" element={<Navigate to="/watch/:id" replace />} />
```

---

#### Bước 3: Cập Nhật Database Schema (Tùy Chọn)

**Các trường mới trong form nhưng chưa có trong database**:
- `tags` (text[]) - Đã có trong form nhưng chưa lưu vào DB
- `visibility` - Form có 4 option nhưng DB chỉ dùng `is_public` boolean
- `scheduled_at` - Lên lịch đăng

**Giải pháp**: Migration thêm columns hoặc điều chỉnh logic lưu

---

#### Bước 4: Mở Rộng Kho Template Thumbnail

**Hiện tại**: `ThumbnailGallery.tsx` có 20 template từ Unsplash (placeholder).

**Cần làm**:
- Con cung cấp 200 URL template thực tế
- Hoặc upload templates lên R2 bucket

---

### Thứ Tự Triển Khai

| Bước | Task | Chi tiết |
|------|------|----------|
| 1 | **Tích hợp UploadWizard** | Thêm nút mở wizard vào Header + MobileNav |
| 2 | **Thêm route `/v/:id`** | Redirect đến `/watch/:id` |
| 3 | **Test end-to-end** | Upload video qua wizard, kiểm tra flow |
| 4 | **Điều chỉnh nếu cần** | Fix lỗi, UI/UX improvements |
| 5 | **Database migration** (optional) | Thêm tags, visibility, scheduled_at |
| 6 | **Mở rộng template gallery** (optional) | Thêm 180 templates còn lại |

---

### Chi Tiết Kỹ Thuật Bước 1

**File: `src/components/Layout/Header.tsx`**

Thêm:
```tsx
import { UploadWizard } from "@/components/Upload/UploadWizard";

// Trong component:
const [uploadOpen, setUploadOpen] = useState(false);

// Trong JSX:
<Button onClick={() => setUploadOpen(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Đăng Video
</Button>

<UploadWizard open={uploadOpen} onOpenChange={setUploadOpen} />
```

**File: `src/components/Layout/MobileBottomNav.tsx`**

Thêm nút + ở giữa navigation bar để mở UploadWizard.

---

### Tóm Tắt

| Đã hoàn thành | Cần làm tiếp |
|---------------|--------------|
| 9 component Upload Wizard | Tích hợp vào Header/MobileNav |
| Form metadata với tags, visibility | Route `/v/:id` redirect |
| Thumbnail Editor 3 tabs | Test end-to-end |
| Canvas text overlay | (Optional) DB migration cho tags |
| Success screen với confetti | (Optional) Thêm 180 templates |

