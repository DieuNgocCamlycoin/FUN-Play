

# Kế Hoạch Hoàn Thiện Controls Visibility + Mini Player

## Tóm Tắt Vấn Đề

| Vấn đề | Nguyên nhân | Ảnh hưởng |
|--------|-------------|-----------|
| **Controls không hiện lại khi tap** | Bug trong logic `handleTap`: kiểm tra `lastTap?.time === now` luôn false vì `lastTap` đã được gán giá trị mới | User không thể bấm Pause, Minimize, Previous/Next sau khi controls auto-hide |
| **Mini player không hiển thị** | Không có global state quản lý mini player, Index.tsx không đọc navigation state | Khi minimize hoặc kéo xuống về trang chủ, không thấy video thu nhỏ góc phải |

---

## Giải Pháp

### 1. Fix Controls Tap Logic (YouTubeMobilePlayer.tsx)

**Vấn đề hiện tại (dòng 141-149):**
```typescript
} else {
  setLastTap({ time: now, x });
  // Single tap - toggle controls
  setTimeout(() => {
    if (lastTap?.time === now) {  // BUG: lastTap đã được set mới → luôn false!
      resetControlsTimeout();
    }
  }, 300);
}
```

**Giải pháp:**
- Thay đổi logic: Nếu không phải double-tap, ngay lập tức toggle controls
- Sử dụng `useRef` để track tap count thay vì so sánh `lastTap?.time`
- Loại bỏ delay 300ms cho single tap để controls hiện ngay lập tức

**Code mới:**
```typescript
const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const tapCountRef = useRef(0);

const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
  if (isDragging) return;
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;

  const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
  const x = clientX - rect.left;
  const isLeftHalf = x < rect.width / 2;

  tapCountRef.current += 1;
  
  if (tapTimeoutRef.current) {
    clearTimeout(tapTimeoutRef.current);
  }

  tapTimeoutRef.current = setTimeout(() => {
    if (tapCountRef.current === 1) {
      // Single tap - toggle controls visibility
      setShowControls(prev => !prev);
      if (!showControls && isPlaying) {
        // Nếu vừa hiện controls và đang playing → set timeout để auto-hide
        hideControlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    } else if (tapCountRef.current >= 2) {
      // Double tap - skip 15s
      if (isLeftHalf) {
        seekRelative(-SKIP_SECONDS);
        setShowSkipIndicator('left');
      } else {
        seekRelative(SKIP_SECONDS);
        setShowSkipIndicator('right');
      }
      setTimeout(() => setShowSkipIndicator(null), 600);
    }
    tapCountRef.current = 0;
  }, 250); // 250ms window để detect double-tap
};
```

---

### 2. Tạo Global Mini Player System

#### File mới: `src/contexts/MiniPlayerContext.tsx`

**Chức năng:**
- Global state quản lý video đang minimize
- Cho phép mọi trang đọc/ghi trạng thái mini player
- Tự động sync giữa các components

```typescript
interface MiniPlayerVideo {
  id: string;
  videoUrl: string;
  title: string;
  channelName: string;
  thumbnailUrl: string | null;
  currentTime: number;
  duration: number;
}

interface MiniPlayerContextValue {
  miniPlayerVideo: MiniPlayerVideo | null;
  isPlaying: boolean;
  showMiniPlayer: (video: MiniPlayerVideo) => void;
  hideMiniPlayer: () => void;
  togglePlay: () => void;
  updateProgress: (time: number, duration: number) => void;
  expandVideo: () => void; // Navigate to /watch/:id
}
```

#### File mới: `src/components/Video/GlobalMiniPlayer.tsx`

**Chức năng:**
- Render MiniPlayer component với data từ context
- Fixed position `bottom-20 right-2` (trên bottom nav)
- Z-index cao: `z-50`
- Không render nếu `miniPlayerVideo === null`
- Tap vào video → navigate to `/watch/:id` và close mini player
- Có thể play/pause, next, close

#### File sửa: `src/App.tsx`

**Thay đổi:**
- Wrap toàn bộ app với `MiniPlayerProvider`
- Render `GlobalMiniPlayer` bên ngoài Routes (cùng cấp với Toaster)

```tsx
import { MiniPlayerProvider } from './contexts/MiniPlayerContext';
import { GlobalMiniPlayer } from './components/Video/GlobalMiniPlayer';

// Trong AppContent:
return (
  <>
    <RecoveryModeGuard>
      {/* ... routes ... */}
    </RecoveryModeGuard>
    <GlobalMiniPlayer />  {/* Thêm ở đây */}
    <Toaster />
    <Sonner />
  </>
);

// Trong App:
const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MusicPlayerProvider>
          <VideoPlaybackProvider>
            <MiniPlayerProvider>  {/* Thêm provider */}
              <BrowserRouter>
                <AppContent />
                {/* ... */}
              </BrowserRouter>
            </MiniPlayerProvider>
          </VideoPlaybackProvider>
        </MusicPlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
```

#### File sửa: `src/components/Video/Mobile/MobileWatchView.tsx`

**Thay đổi:**
- Import và sử dụng `useMiniPlayer` context thay vì local state `isMinimized`
- Khi bấm minimize → gọi `showMiniPlayer(videoData)` từ context + navigate to "/"
- Không cần render MiniPlayer trong component này nữa (GlobalMiniPlayer đã xử lý)

```typescript
import { useMiniPlayer } from '@/contexts/MiniPlayerContext';

export function MobileWatchView({ video, ... }) {
  const { showMiniPlayer } = useMiniPlayer();
  
  const handleMinimize = () => {
    showMiniPlayer({
      id: video.id,
      videoUrl: video.video_url,
      title: video.title,
      channelName: video.channels.name,
      thumbnailUrl: video.thumbnail_url,
      currentTime,
      duration,
    });
    navigate("/");
  };

  // Xóa phần if (isMinimized) return <MiniPlayer ... />
  // GlobalMiniPlayer sẽ tự render ở App level
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ... giữ nguyên phần còn lại ... */}
    </div>
  );
}
```

---

## Tóm Tắt Files Cần Tạo/Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `src/components/Video/YouTubeMobilePlayer.tsx` | EDIT | Fix tap logic để controls hiện ngay khi tap |
| `src/contexts/MiniPlayerContext.tsx` | NEW | Global context quản lý mini player |
| `src/components/Video/GlobalMiniPlayer.tsx` | NEW | Mini player component render ở App level |
| `src/App.tsx` | EDIT | Thêm MiniPlayerProvider + GlobalMiniPlayer |
| `src/components/Video/Mobile/MobileWatchView.tsx` | EDIT | Sử dụng context thay vì local state |

---

## Chi Tiết Kỹ Thuật

### GlobalMiniPlayer Layout

```text
┌─────────────────────────────────────────────┐
│                                             │
│                   (Home Page)               │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│                                    ┌──────┐ │
│                                    │ 🎬   │ │
│                                    │▶️⏭️❌│ │
│                                    └──────┘ │
├─────────────────────────────────────────────┤
│ 🏠  Shorts  ➕  📺  👤                       │ ← Bottom Nav
└─────────────────────────────────────────────┘
```

### Flow hoạt động

```text
User xem video → Bấm ˅ hoặc kéo xuống
    ↓
handleMinimize() gọi:
  1. showMiniPlayer(videoData) → Update context
  2. navigate("/") → Chuyển về trang chủ
    ↓
GlobalMiniPlayer detect context có video
    ↓
Render mini player góc dưới phải
    ↓
User tap mini player → navigate to /watch/:id
  + hideMiniPlayer() → Close mini player
```

---

## Kết Quả Mong Đợi

| Tính năng | Kết quả |
|-----------|---------|
| Tap video khi controls ẩn | Controls hiện ngay lập tức (không delay) |
| Double-tap | Skip ±15 giây (vẫn giữ nguyên) |
| Bấm nút ˅ (minimize) | Video thu nhỏ góc phải + về trang chủ |
| Kéo video xuống | Video thu nhỏ góc phải + về trang chủ |
| Tap mini player | Expand về xem video full screen |
| Bấm ❌ trên mini player | Đóng mini player |
| Bấm ▶️/⏸️ trên mini player | Play/Pause video |

---

## Thứ Tự Triển Khai

1. **Fix tap logic** trong `YouTubeMobilePlayer.tsx` (ưu tiên cao nhất)
2. **Tạo `MiniPlayerContext.tsx`** với đầy đủ state và functions
3. **Tạo `GlobalMiniPlayer.tsx`** với UI và logic
4. **Sửa `App.tsx`** thêm provider và render global mini player
5. **Sửa `MobileWatchView.tsx`** sử dụng context
6. **Test end-to-end**: Tap controls + Minimize + Expand

