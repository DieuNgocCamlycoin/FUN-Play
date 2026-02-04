
# Kế Hoạch: Thêm Nút X và Mini-Player cho Desktop Video Player

## Vấn Đề Phát Hiện

| Vấn Đề | Nguyên Nhân |
|--------|-------------|
| Nút X và thu nhỏ không hoạt động | Em đang xem trên **Desktop** - sử dụng `EnhancedVideoPlayer` thay vì `YouTubeMobilePlayer` |
| `EnhancedVideoPlayer` thiếu nút X | Component này chưa được thêm nút đóng video và quay về trang chủ |
| Không có mini-player trên desktop | Logic mini-player chỉ hoạt động với mobile view |

## Giải Pháp

### 1. Thêm nút X vào EnhancedVideoPlayer (Desktop)

**File: `src/components/Video/EnhancedVideoPlayer.tsx`**

Thêm nút X ở góc trên trái của video player khi hover, cho phép đóng video và quay về trang chủ:

```typescript
// Import thêm
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Trong component
const navigate = useNavigate();

// Thêm nút X vào top bar của controls
<div className="absolute top-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
  <Button
    variant="ghost"
    size="icon"
    onClick={(e) => {
      e.stopPropagation();
      navigate('/');
    }}
    className="h-10 w-10 text-white bg-black/40 hover:bg-red-500/30 rounded-full backdrop-blur-sm"
  >
    <X className="h-6 w-6" />
  </Button>
</div>
```

### 2. Thêm Picture-in-Picture (thay thế mini-player cho desktop)

Desktop đã có nút PiP (Picture-in-Picture) - đây là chức năng tương đương mini-player cho desktop browsers. Cần đảm bảo nút này hoạt động tốt.

### 3. Đảm bảo cả Mobile lẫn Desktop đều có nút X

**Kiểm tra responsive:**
- Mobile (< 768px): Dùng `YouTubeMobilePlayer` với nút X và ChevronDown minimize
- Desktop (>= 768px): Dùng `EnhancedVideoPlayer` với nút X và PiP

---

## Danh Sách File Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Video/EnhancedVideoPlayer.tsx` | SỬA | Thêm nút X đóng video và quay về trang chủ |

---

## Chi Tiết Triển Khai

### EnhancedVideoPlayer.tsx - Thêm Nút X

```typescript
// 1. Thêm import
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 2. Trong component, thêm hook
const navigate = useNavigate();

// 3. Thêm nút X vào controls overlay (sau video element, trong phần controls)
{/* Close button - Top left, visible on hover */}
<div className={cn(
  "absolute top-4 left-4 transition-opacity duration-300",
  showControls ? "opacity-100" : "opacity-0"
)}>
  <Button
    variant="ghost"
    size="icon"
    onClick={(e) => {
      e.stopPropagation();
      // Pause video before leaving
      if (videoRef.current) {
        videoRef.current.pause();
      }
      navigate('/');
    }}
    className="h-10 w-10 text-white bg-black/50 hover:bg-red-500/40 rounded-full backdrop-blur-sm transition-all duration-200"
    title="Đóng video"
  >
    <X className="h-6 w-6" />
  </Button>
</div>
```

---

## Kết Quả Mong Đợi

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| Nút X trên Desktop | Không có | Có - góc trên trái, hiện khi hover |
| Đóng video Desktop | Phải bấm back browser | Bấm X quay về trang chủ |
| PiP Desktop | Đã có | Giữ nguyên - mini player thay thế |
| Nút X trên Mobile | Đã có | Giữ nguyên |

---

## Ghi Chú Kỹ Thuật

1. **useNavigate**: Đã được import trong nhiều component, chỉ cần thêm vào EnhancedVideoPlayer
2. **stopPropagation**: Quan trọng để không trigger togglePlay() khi bấm nút
3. **Pause video**: Dừng video trước khi navigate để tránh tiếng phát tiếp
4. **z-index**: Nút nằm trong controls overlay, sẽ ẩn/hiện cùng controls
5. **PiP**: Desktop dùng Picture-in-Picture thay cho mini-player - đây là chuẩn browser

---

## Test Cases

1. **Desktop**: Mở video → hover vào player → thấy nút X góc trên trái
2. **Desktop**: Bấm X → video dừng → quay về trang chủ
3. **Desktop**: Bấm PiP → video thu nhỏ floating góc màn hình (browser native)
4. **Mobile**: Vẫn hoạt động bình thường với YouTubeMobilePlayer
