
# Kế Hoạch: Hoàn Thiện Video Player Mobile

## Tổng Quan
Triển khai 4 tính năng theo mẫu YouTube mobile cho trình phát video:
1. Thu nhỏ màn hình → hiển thị trang chủ với mini player
2. Settings: thêm lặp lại video và tốc độ phát
3. Thanh progress tích hợp vào viền dưới cùng của video
4. Hoàn thiện xoay màn hình khi fullscreen

---

## Tính Năng 1: Hoàn Thiện Thu Nhỏ Màn Hình

### Tình trạng hiện tại
- `MobileWatchView.tsx` đã có hàm `handleMinimize()` gọi `showMiniPlayer()` và `navigate("/")` 
- `GlobalMiniPlayer` component đã render trong `App.tsx`
- Context `MiniPlayerContext` đã có đầy đủ logic

### Vấn đề cần khắc phục
- Cần đảm bảo khi bấm nút mũi tên xuống, mini player hiển thị đúng với thời gian video hiện tại
- Đảm bảo không có lag khi navigate về trang chủ

### Giải pháp
Đã hoạt động tốt - chỉ cần xác nhận flow:
1. Bấm ChevronDown → `handleMinimize()` được gọi
2. `showMiniPlayer()` lưu video state vào context 
3. `navigate("/")` về trang chủ
4. `GlobalMiniPlayer` tự động hiển thị ở góc phải dưới

---

## Tính Năng 2: Settings - Lặp Lại & Tốc Độ Phát

### Thiết kế UI (Bottom Sheet cho Mobile)

```text
Khi bấm nút Settings (⚙️) trên video player:

+----------------------------------+
|        ═══════════               | <- Drag handle
|  Cài đặt                         |
+----------------------------------+
|  Tốc độ phát                     |
|  [0.5x] [0.75x] [1x] [1.25x] [2x]|
+----------------------------------+
|  Lặp lại                         |
|  ○ Tắt                           |
|  ○ Lặp tất cả                    |
|  ● Lặp một video                 | <- Radio buttons
+----------------------------------+
```

### Thay đổi code

| File | Thay đổi |
|------|----------|
| `src/components/Video/YouTubeMobilePlayer.tsx` | Thêm state settings, drawer, logic loop/speed |
| `src/components/Video/PlayerSettingsDrawer.tsx` | **TẠO MỚI** - Bottom sheet cho settings mobile |

### Chi tiết PlayerSettingsDrawer.tsx

```typescript
interface PlayerSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  loopMode: "off" | "all" | "one";
  onLoopChange: (mode: "off" | "all" | "one") => void;
}

// Các tốc độ phát
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
```

### Chi tiết YouTubeMobilePlayer.tsx

```typescript
// Thêm states
const [playbackSpeed, setPlaybackSpeed] = useState(1);
const [loopMode, setLoopMode] = useState<"off" | "all" | "one">("off");
const [settingsOpen, setSettingsOpen] = useState(false);

// Apply speed khi thay đổi
useEffect(() => {
  if (videoRef.current) {
    videoRef.current.playbackRate = playbackSpeed;
  }
}, [playbackSpeed]);

// Handle video end với loop
const handleVideoEnd = () => {
  if (loopMode === "one") {
    videoRef.current?.play();
    videoRef.current!.currentTime = 0;
  } else {
    onEnded?.();
  }
};
```

---

## Tính Năng 3: Progress Bar Tích Hợp Viền Dưới

### Thiết kế (như YouTube mobile)

```text
+----------------------------------+
|                                  |
|        [Video content]           |
|                                  |
|══════════════════════════════════| <- Progress bar mỏng (3px) ở viền dưới cùng
```

Khi controls ẩn: progress bar vẫn hiển thị ở viền dưới
Khi controls hiện: progress bar đầy đủ với slider

### Thay đổi code

```typescript
// YouTubeMobilePlayer.tsx
// Thêm thin progress bar luôn hiển thị ở bottom edge

{/* Always visible thin progress bar (when controls hidden) */}
{!showControls && (
  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
    <div 
      className="h-full bg-red-600 transition-all duration-100"
      style={{ width: `${(currentTime / duration) * 100}%` }}
    />
  </div>
)}
```

---

## Tính Năng 4: Hoàn Thiện Xoay Màn Hình Fullscreen

### Tình trạng hiện tại
`toggleFullscreen()` đã có logic:
- Vào fullscreen → lock orientation theo video ratio
- Thoát fullscreen → unlock orientation

### Vấn đề cần khắc phục
1. Cần handle case khi user xoay device manually
2. Đảm bảo video fill màn hình đúng khi landscape
3. Thêm exit gesture (swipe down để thoát fullscreen)

### Giải pháp

```typescript
// Cải thiện fullscreen logic
const toggleFullscreen = async () => {
  const container = containerRef.current;
  const video = videoRef.current;
  if (!container || !video) return;

  try {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      await container.requestFullscreen();
      setIsFullscreen(true);
      
      // Lock orientation dựa theo video aspect ratio
      const isPortraitVideo = video.videoHeight > video.videoWidth;
      try {
        await screen.orientation.lock(isPortraitVideo ? 'portrait' : 'landscape');
      } catch (e) {
        // Fallback: không lock được thì để tự do
      }
    } else {
      // Exit fullscreen
      await document.exitFullscreen();
      setIsFullscreen(false);
      
      try {
        screen.orientation.unlock();
      } catch (e) {}
    }
  } catch (e) {
    console.error("Fullscreen error:", e);
  }
};

// Listen for orientation change để adjust video
useEffect(() => {
  const handleOrientation = () => {
    if (isFullscreen && videoRef.current) {
      // Force video to fill screen
      videoRef.current.style.objectFit = 'contain';
    }
  };
  
  window.addEventListener('orientationchange', handleOrientation);
  return () => window.removeEventListener('orientationchange', handleOrientation);
}, [isFullscreen]);
```

---

## Danh Sách File Thay Đổi

| File | Loại | Mô tả |
|------|------|-------|
| `src/components/Video/YouTubeMobilePlayer.tsx` | SỬA | Thêm settings drawer, progress bar mỏng, cải thiện fullscreen |
| `src/components/Video/PlayerSettingsDrawer.tsx` | TẠO MỚI | Bottom sheet cho tốc độ và lặp lại |

---

## Chi Tiết Triển Khai

### PlayerSettingsDrawer.tsx (Component mới)

```typescript
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Repeat, Repeat1 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  loopMode: "off" | "all" | "one";
  onLoopChange: (mode: "off" | "all" | "one") => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlayerSettingsDrawer({
  open, onOpenChange,
  playbackSpeed, onSpeedChange,
  loopMode, onLoopChange,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background">
        <DrawerHeader>
          <DrawerTitle>Cài đặt</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4 space-y-6">
          {/* Tốc độ phát */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tốc độ phát</Label>
            <div className="flex flex-wrap gap-2">
              {SPEEDS.map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onSpeedChange(speed);
                    onOpenChange(false);
                  }}
                  className="min-w-[60px]"
                >
                  {speed === 1 ? "Bình thường" : `${speed}x`}
                </Button>
              ))}
            </div>
          </div>

          {/* Lặp lại */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Lặp lại</Label>
            <RadioGroup 
              value={loopMode} 
              onValueChange={(v) => {
                onLoopChange(v as "off" | "all" | "one");
                onOpenChange(false);
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="off" id="loop-off" />
                <Label htmlFor="loop-off" className="flex-1 cursor-pointer">Tắt</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="all" id="loop-all" />
                <Label htmlFor="loop-all" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Lặp tất cả
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="one" id="loop-one" />
                <Label htmlFor="loop-one" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Repeat1 className="h-4 w-4" />
                  Lặp một video
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

### YouTubeMobilePlayer.tsx - Các thay đổi chính

```typescript
// 1. Thêm imports
import { PlayerSettingsDrawer } from "./PlayerSettingsDrawer";

// 2. Thêm states
const [playbackSpeed, setPlaybackSpeed] = useState(1);
const [loopMode, setLoopMode] = useState<"off" | "all" | "one">("off");
const [settingsOpen, setSettingsOpen] = useState(false);

// 3. Apply speed
useEffect(() => {
  if (videoRef.current) {
    videoRef.current.playbackRate = playbackSpeed;
  }
}, [playbackSpeed]);

// 4. Handle loop on video end
// Thay đổi onEnded handler của video element
onEnded={() => {
  if (loopMode === "one") {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  } else {
    setIsPlaying(false);
    onEnded?.();
  }
}}

// 5. Settings button mở drawer
<Button 
  onClick={(e) => { 
    e.stopPropagation(); 
    setSettingsOpen(true); 
  }}
>
  <Settings className="h-5 w-5" />
</Button>

// 6. Progress bar mỏng khi controls ẩn
{!showControls && (
  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-30">
    <div 
      className="h-full bg-red-600 transition-all duration-100"
      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
    />
  </div>
)}

// 7. Render PlayerSettingsDrawer
<PlayerSettingsDrawer
  open={settingsOpen}
  onOpenChange={setSettingsOpen}
  playbackSpeed={playbackSpeed}
  onSpeedChange={setPlaybackSpeed}
  loopMode={loopMode}
  onLoopChange={setLoopMode}
/>
```

---

## Kết Quả Mong Đợi

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Thu nhỏ màn hình | Đã hoạt động cơ bản | Đảm bảo smooth transition về homepage |
| Nút Settings | Chỉ có icon, không có chức năng | Mở bottom sheet với tốc độ + lặp lại |
| Tốc độ phát | Không có trên mobile | 6 tùy chọn: 0.5x → 2x |
| Lặp lại video | Không có | 3 mode: Tắt, Lặp tất cả, Lặp một |
| Progress bar | Ẩn khi controls ẩn | Thanh mỏng 3px luôn hiển thị ở viền dưới |
| Fullscreen | Hoạt động cơ bản | Lock orientation theo video ratio, handle device rotation |

---

## Ghi Chú Kỹ Thuật

1. **localStorage**: Có thể lưu playbackSpeed và loopMode vào localStorage để giữ lại preference
2. **VideoPlaybackContext**: loopMode có thể tích hợp với `setRepeat()` từ context để sync across sessions
3. **Orientation API**: Một số browser/device không hỗ trợ - cần fallback gracefully
4. **Progress bar màu đỏ**: Theo chuẩn YouTube, dùng `bg-red-600` hoặc primary color
