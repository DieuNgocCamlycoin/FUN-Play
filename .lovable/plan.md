

## Tự Động Tạo Thumbnail Từ Video (Giống YouTube)

### Tổng Quan

Thay đổi logic thumbnail mặc định: thay vì dùng 10 hình Bé Ly trong thư mục `default-thumbnails`, hệ thống sẽ **tự động trích xuất 1 frame từ video** khi user không upload thumbnail riêng.

### Cách Hoạt Động

```text
User upload video → Không chọn thumbnail riêng
    ↓
Hệ thống tự động:
    1. Load video vào <video> element (ẩn)
    2. Seek đến giây thứ 2 (hoặc 25% duration)
    3. Capture frame bằng <canvas>
    4. Convert sang Blob (JPEG)
    5. Upload thumbnail lên R2
    6. Lưu URL vào database
```

---

### Các Bước Thực Hiện

#### Bước 1: Tạo utility function trích xuất frame từ video

**File mới:** `src/lib/videoThumbnail.ts`

```typescript
/**
 * Trích xuất 1 frame từ video file làm thumbnail
 * @param videoFile - File video từ input
 * @param seekPercent - Vị trí lấy frame (0-1), mặc định 0.25 (25%)
 * @returns Promise<Blob | null> - JPEG blob của frame
 */
export async function extractVideoThumbnail(
  videoFile: File, 
  seekPercent: number = 0.25
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      // Seek to position (default: 25% of video duration, or 2 seconds minimum)
      const seekTime = Math.max(2, video.duration * seekPercent);
      video.currentTime = Math.min(seekTime, video.duration - 0.5);
    };

    video.onseeked = () => {
      // Create canvas with video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG blob
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          resolve(blob);
        },
        'image/jpeg',
        0.85 // Quality 85%
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
  });
}
```

---

#### Bước 2: Cập nhật `UploadVideoModal.tsx`

**Thay đổi logic upload thumbnail:**

```typescript
// Import utility mới
import { extractVideoThumbnail } from "@/lib/videoThumbnail";

// Trong handleSubmit(), sau khi upload video:

// Upload thumbnail to Cloudflare R2
let thumbnailUrl = null;

// Nếu user có chọn thumbnail riêng → upload thumbnail đó
if (thumbnailFile) {
  // ... giữ nguyên logic hiện tại ...
} 
// Nếu KHÔNG chọn thumbnail VÀ có video file → tự động trích xuất từ video
else if (videoFile) {
  setUploadStage("Đang tạo thumbnail từ video...");
  setUploadProgress(87);
  
  const extractedBlob = await extractVideoThumbnail(videoFile);
  
  if (extractedBlob) {
    const thumbnailFileName = `thumbnails/${Date.now()}-auto-thumb.jpg`;
    
    const { data: thumbPresign, error: thumbPresignError } = await supabase.functions.invoke('r2-upload', {
      body: {
        action: 'getPresignedUrl',
        fileName: thumbnailFileName,
        contentType: 'image/jpeg',
        fileSize: extractedBlob.size,
      },
    });

    if (!thumbPresignError && thumbPresign?.presignedUrl) {
      try {
        const thumbResponse = await fetch(thumbPresign.presignedUrl, {
          method: 'PUT',
          body: extractedBlob,
        });

        if (thumbResponse.ok) {
          thumbnailUrl = thumbPresign.publicUrl;
          console.log('Auto-generated thumbnail uploaded:', thumbnailUrl);
        }
      } catch (thumbErr) {
        console.error('Auto thumbnail upload error:', thumbErr);
      }
    }
  }
}
```

---

#### Bước 3: Cập nhật `EditVideoModal.tsx` (Studio)

Thêm tính năng tương tự cho trường hợp edit video và muốn regenerate thumbnail:

```typescript
// Thêm nút "Tạo từ video" bên cạnh input upload thumbnail

<Button 
  type="button" 
  variant="outline" 
  onClick={generateThumbnailFromVideo}
>
  🎬 Tạo từ video
</Button>
```

---

#### Bước 4: Cập nhật fallback `getDefaultThumbnail()`

Giữ nguyên `defaultThumbnails.ts` làm **fallback cuối cùng** cho trường hợp:
- Video được nhập bằng YouTube URL (không có file để trích xuất)
- Trích xuất frame thất bại

Nhưng thay đổi các component để ưu tiên dùng `thumbnail_url` từ database (đã được tự động tạo từ video).

---

### Tóm Tắt File Thay Đổi

| File | Thay đổi |
|------|----------|
| `src/lib/videoThumbnail.ts` | **MỚI** - Utility trích xuất frame từ video |
| `src/components/Video/UploadVideoModal.tsx` | Tự động tạo thumbnail nếu user không chọn |
| `src/components/Studio/EditVideoModal.tsx` | Thêm nút "Tạo từ video" |

---

### Chi Tiết Kỹ Thuật

**Tại sao chọn 25% duration?**
- Frame đầu (0s) thường là logo/intro
- 25% duration thường hiển thị nội dung chính của video
- Giống cách YouTube chọn thumbnail mặc định

**Tại sao dùng JPEG 85%?**
- Cân bằng chất lượng và dung lượng
- JPEG phù hợp cho hình ảnh thực (video frame)
- 85% gần như không nhìn thấy sự khác biệt với 100%

**Edge cases:**
- Video rất ngắn (<3 giây): Lấy frame ở giây thứ 1
- Video URL (YouTube): Giữ fallback hình Bé Ly
- Trích xuất thất bại: Giữ fallback hình Bé Ly

---

### Kết Quả Mong Đợi

Sau khi implement:
- User upload video → Thumbnail tự động được tạo từ frame video
- Không còn thấy hình Bé Ly lặp lại nhiều lần
- Giống trải nghiệm YouTube khi user không chọn thumbnail

