
## Kế Hoạch Auto-Generate Thumbnail Khi Upload Video

### Phân Tích Hiện Trạng

**Tình trạng hiện tại trong `Upload.tsx` (dòng 327-359):**
- Nếu user chọn thumbnailFile → upload lên R2
- Nếu user KHÔNG chọn thumbnail → `thumbnailUrl = null` → Video không có thumbnail

**Tính năng đã có sẵn:**
- `extractVideoThumbnail(videoFile)` - Trích xuất frame từ video file trước khi upload
- `extractVideoThumbnailFromUrl(videoUrl)` - Trích xuất frame từ video URL sau khi upload

---

### Kế Hoạch Thực Hiện

#### Bước 1: Thêm Import Trong `Upload.tsx`

```typescript
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
```

---

#### Bước 2: Auto-Generate Thumbnail Sau Khi Upload Video

Cập nhật phần xử lý thumbnail (dòng 327-359):

**Trước (hiện tại):**
```typescript
// Step 3: Upload thumbnail to R2 (85% - 90% progress)
let thumbnailUrl = null;
if (thumbnailFile) {
  // Upload custom thumbnail...
  thumbnailUrl = thumbPresign.publicUrl;
}
```

**Sau (thêm auto-generate):**
```typescript
// Step 3: Upload thumbnail to R2 (85% - 90% progress)
let thumbnailUrl = null;

if (thumbnailFile) {
  // User đã chọn thumbnail riêng → Upload lên R2
  setUploadStage("Đang tải thumbnail lên R2...");
  setUploadProgress(87);
  // ... existing upload code
  thumbnailUrl = thumbPresign.publicUrl;
  
} else {
  // TỰ ĐỘNG tạo thumbnail từ video
  setUploadStage("Đang tạo thumbnail từ video...");
  setUploadProgress(87);
  
  try {
    const thumbnailBlob = await extractVideoThumbnail(videoFile, 0.25);
    
    if (thumbnailBlob) {
      setUploadStage("Đang upload thumbnail tự động...");
      setUploadProgress(88);
      
      // Tạo file name cho thumbnail
      const autoThumbFileName = `thumbnails/${Date.now()}-auto-thumb.jpg`;
      
      // Get presigned URL
      const { data: thumbPresign, error: thumbPresignError } = await supabase.functions.invoke('r2-upload', {
        body: {
          action: 'getPresignedUrl',
          fileName: autoThumbFileName,
          contentType: 'image/jpeg',
          fileSize: thumbnailBlob.size,
        },
      });

      if (!thumbPresignError && thumbPresign?.presignedUrl) {
        const thumbResponse = await fetch(thumbPresign.presignedUrl, {
          method: 'PUT',
          body: thumbnailBlob,
          headers: { 'Content-Type': 'image/jpeg' },
        });
        
        if (thumbResponse.ok) {
          thumbnailUrl = thumbPresign.publicUrl;
          console.log('Auto-generated thumbnail uploaded:', thumbnailUrl);
        }
      }
    }
  } catch (thumbErr) {
    console.warn('Auto thumbnail generation failed, video will use placeholder:', thumbErr);
  }
}
```

---

### Flow Mới Sau Khi Sửa

```text
Upload Video Flow:
┌─────────────────────────────────┐
│ 1. User chọn video file         │
│ 2. Upload video lên R2          │
│ 3. Kiểm tra thumbnailFile       │
│    ├── CÓ → Upload custom thumb │
│    └── KHÔNG → Auto-generate    │
│        ├── extractVideoThumbnail│
│        │   (lấy frame 25%)      │
│        ├── Upload blob lên R2   │
│        └── Lưu thumbnailUrl     │
│ 4. Lưu video vào database       │
│    với thumbnail_url            │
└─────────────────────────────────┘
```

---

### Tóm Tắt Thay Đổi

| File | Thay đổi |
|------|----------|
| `src/pages/Upload.tsx` | Thêm import `extractVideoThumbnail` |
| `src/pages/Upload.tsx` | Thêm logic auto-generate thumbnail (~30 dòng) |

---

### Kết Quả Mong Đợi

| Trường hợp | Kết quả |
|------------|---------|
| User upload video + KHÔNG chọn thumbnail | Tự động tạo thumbnail từ frame 25% của video |
| User upload video + CÓ chọn thumbnail | Dùng thumbnail do user chọn |
| Auto-generate thất bại (video không load được) | Video sẽ hiển thị VideoPlaceholder gradient |

---

### Lưu Ý Kỹ Thuật

1. **Vị trí lấy frame**: 25% duration (giống YouTube) để tránh lấy frame đen ở đầu video
2. **Fallback graceful**: Nếu auto-generate fail → Video vẫn upload thành công, chỉ không có thumbnail
3. **Không block upload**: Lỗi thumbnail không làm thất bại toàn bộ upload
4. **Chất lượng**: JPEG 85% để cân bằng chất lượng và kích thước file
