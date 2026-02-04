
# Kế Hoạch Sửa Lỗi Upload Desktop

## Vấn Đề

Hệ thống upload có 2 giao diện tồn tại song song:

| Component | Vấn đề |
|-----------|--------|
| Upload.tsx (route /upload) | Giao diện cũ, không đẹp bằng wizard |
| UploadWizard | Wizard 4 bước hiện đại, đẹp |

Một số vị trí đang navigate đến `/upload` route thay vì mở UploadWizard modal:
- MobileHeader.tsx → "Upload Video" menu item
- StudioContent.tsx → Nút "Tải video lên"
- YourVideos.tsx → Nút "Tải video đầu tiên"

---

## Giải Pháp

Thống nhất sử dụng **UploadWizard modal** cho tất cả các điểm upload, thay vì navigate đến route `/upload`.

---

## Thay Đổi Chi Tiết

### 1. MobileHeader.tsx
- Thêm state `uploadModalOpen`
- Import UploadWizard hoặc MobileUploadFlow
- Thay `navigate("/upload")` bằng `setUploadModalOpen(true)`
- Render UploadWizard/MobileUploadFlow component

### 2. StudioContent.tsx  
- Thêm state `uploadModalOpen`
- Import UploadWizard
- Thay `navigate("/upload")` bằng `setUploadModalOpen(true)` (2 chỗ)
- Render UploadWizard component

### 3. YourVideos.tsx
- Thêm state `uploadModalOpen`
- Import UploadWizard
- Thay `navigate("/upload")` bằng `setUploadModalOpen(true)`
- Render UploadWizard component

### 4. (Tùy chọn) Upload.tsx Route
Giữ lại route `/upload` như một fallback nhưng redirect người dùng về home với modal mở:
- Hoặc có thể xóa route hoàn toàn nếu không còn cần thiết

---

## Files Thay Đổi

| Action | File | Mô tả |
|--------|------|-------|
| EDIT | `src/components/Layout/MobileHeader.tsx` | Thêm UploadWizard modal thay navigate |
| EDIT | `src/components/Studio/StudioContent.tsx` | Thêm UploadWizard modal thay navigate |
| EDIT | `src/pages/YourVideos.tsx` | Thêm UploadWizard modal thay navigate |

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Click "Upload" → Trang cũ kiểu mobile | Click "Upload" → UploadWizard đẹp |
| Giao diện không nhất quán | UX thống nhất trên cả desktop/mobile |
| Trang /upload hiển thị giao diện cũ | Tất cả đều mở modal wizard |

---

## Chi Tiết Kỹ Thuật

Mỗi file sẽ thêm logic tương tự:

```typescript
// Import
import { UploadWizard } from "@/components/Upload/UploadWizard";
import { MobileUploadFlow } from "@/components/Upload/Mobile/MobileUploadFlow";
import { useIsMobile } from "@/hooks/use-mobile";

// State
const [uploadModalOpen, setUploadModalOpen] = useState(false);
const isMobile = useIsMobile();

// Thay navigate("/upload")
onClick={() => setUploadModalOpen(true)}

// Render modal (cuối component)
{isMobile ? (
  <MobileUploadFlow open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
) : (
  <UploadWizard open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
)}
```
