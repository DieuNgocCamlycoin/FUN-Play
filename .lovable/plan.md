
# Kế Hoạch: Hoàn Thiện Video Player Giống YouTube

## Tổng Quan Các Vấn Đề

| # | Vấn Đề | Tình Trạng Hiện Tại | Mong Muốn (YouTube) |
|---|--------|---------------------|---------------------|
| 1 | Nút bấm dưới video | Icons nhỏ, thiếu dislike count, thiếu glow effect | Icons lớn (24-32px), gradient glow, pulse animation, realtime counts |
| 2 | Mini-player minimize | Bấm ↓ chưa hoạt động mượt, che trang chủ, khó tắt | Thu nhỏ góc phải dưới, không che overlay, swipe down tắt hẳn |

---

## Phần 1: Cải Thiện Nút Bấm Dưới Video (VideoActionsBar)

### Layout Mới (Theo YouTube Mobile - Hình 2)

```text
+------------------------------------------------------------------+
| [Avatar] | Channel Name          | [Đăng ký]                    |
|          | 12 người đăng ký       |                              |
+------------------------------------------------------------------+
| [🔔▼] [👍 8] [👎] [➡️] [🔖 Lưu] [⬇️ Đã tải x...]               |
+------------------------------------------------------------------+
```

### Thay Đổi Chi Tiết

**File: `src/components/Video/Mobile/VideoActionsBar.tsx`**

1. **Thêm notification bell với dropdown** (như YouTube)
2. **Icons lớn hơn** (h-5 w-5 thay vì h-4 w-4)
3. **Gradient glow effect khi hover/tap**:
   ```typescript
   className={cn(
     "transition-all duration-200",
     hasLiked && "text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(0,255,255,0.4)]"
   )}
   ```
4. **Thêm haptic feedback** khi bấm nút
5. **Rainbow sparkle animation khi like**:
   ```css
   @keyframes rainbow-sparkle {
     0% { box-shadow: 0 0 10px rgba(0,255,255,0.5); }
     33% { box-shadow: 0 0 15px rgba(168,85,247,0.5); }
     66% { box-shadow: 0 0 15px rgba(236,72,153,0.5); }
     100% { box-shadow: 0 0 10px rgba(0,255,255,0.5); }
   }
   ```
6. **Tooltip vui** khi hover: "Lan tỏa ánh sáng! ✨"

### Code Changes

```typescript
// Thêm imports
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, BellOff } from "lucide-react";
import { motion } from "framer-motion";

// Trong component
const { lightTap, successFeedback } = useHapticFeedback();

// Like button với gradient glow và animation
<Tooltip>
  <TooltipTrigger asChild>
    <motion.div
      whileTap={{ scale: 0.9 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          successFeedback();
          onLike();
        }}
        className={cn(
          "rounded-full rounded-r-none gap-1.5 h-10 px-4",
          hasLiked && "text-cosmic-cyan bg-cosmic-cyan/10 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        )}
      >
        <ThumbsUp className={cn("h-5 w-5 transition-transform", hasLiked && "fill-current scale-110")} />
        <span className="font-semibold">{formatNumber(likeCount)}</span>
      </Button>
    </motion.div>
  </TooltipTrigger>
  <TooltipContent>
    <p>{hasLiked ? "Đã thích video này!" : "Lan tỏa ánh sáng! ✨"}</p>
  </TooltipContent>
</Tooltip>
```

---

## Phần 2: Sửa Lỗi Minimize Video → Mini-Player

### Vấn Đề Hiện Tại
- `handleMinimize()` trong MobileWatchView gọi `showMiniPlayer()` và `navigate("/")` 
- GlobalMiniPlayer hiển thị ở góc phải dưới với `bottom-20 right-2`
- Vấn đề: Mini-player có thể che MobileBottomNav hoặc không hiển thị đúng

### Giải Pháp

**1. Cải thiện GlobalMiniPlayer positioning và interactions:**

```typescript
// GlobalMiniPlayer.tsx
// Thêm swipe-to-dismiss gesture
<motion.div
  drag="y"
  dragConstraints={{ top: -50, bottom: 100 }}
  onDragEnd={(_, info) => {
    if (info.offset.y > 50) {
      hideMiniPlayer(); // Swipe down to dismiss
    }
  }}
  className={cn(
    "fixed z-[60]", // Higher z-index
    "bottom-[72px] right-3", // Above bottom nav (16px height + padding)
    "w-44 rounded-xl overflow-hidden", // Slightly larger
    "bg-background/95 backdrop-blur-lg",
    "shadow-2xl",
    "border border-primary/20", // Rainbow border subtle
    "cursor-pointer"
  )}
>
```

**2. Thêm rainbow border animation khi mini:**

```typescript
// Thêm class cho rainbow border
"animate-[rainbow-border_3s_ease-in-out_infinite]"

// Trong tailwind.config.ts
"rainbow-border": {
  "0%, 100%": { borderColor: "rgba(0, 255, 255, 0.3)" },
  "33%": { borderColor: "rgba(168, 85, 247, 0.3)" },
  "66%": { borderColor: "rgba(236, 72, 153, 0.3)" },
}
```

**3. Thêm nút X rõ ràng để tắt:**

```typescript
// Close button với haptic feedback
<Button
  variant="ghost"
  size="icon"
  onClick={(e) => {
    e.stopPropagation();
    lightTap();
    hideMiniPlayer();
  }}
  className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500/40"
>
  <X className="h-4 w-4 text-red-400" />
</Button>
```

**4. Đảm bảo mini-player không che tương tác:**

```typescript
// Thêm pointer-events handling
<motion.div
  className="pointer-events-auto" // Only this element captures events
  style={{ pointerEvents: 'auto' }}
>
```

---

## Phần 3: Cải Thiện Swipe Gesture trong YouTubeMobilePlayer

### Vấn Đề
- Drag gesture có nhưng feedback chưa rõ ràng
- Cần thêm indicator "Kéo xuống để thu nhỏ" rõ ràng hơn

### Giải Pháp

```typescript
// YouTubeMobilePlayer.tsx
// Cải thiện drag indicator
{isDragging && (
  <motion.div 
    className="absolute top-8 left-1/2 -translate-x-1/2 
               bg-gradient-to-r from-cyan-500/80 to-purple-500/80 
               rounded-full px-4 py-2 backdrop-blur-sm"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <span className="text-white text-sm font-medium flex items-center gap-2">
      <ChevronDown className="h-4 w-4 animate-bounce" />
      Kéo xuống để thu nhỏ
    </span>
  </motion.div>
)}

// Giảm threshold để dễ trigger hơn
const handleDragEnd = (_event: any, info: PanInfo) => {
  setIsDragging(false);
  setDragY(0);
  
  // Giảm từ 100px xuống 80px để dễ trigger hơn
  if (info.offset.y > 80 || info.velocity.y > 300) {
    lightTap(); // Haptic feedback
    onMinimize?.();
  }
};
```

---

## Danh Sách File Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Video/Mobile/VideoActionsBar.tsx` | SỬA | Icons lớn, gradient glow, haptic, tooltip, animation |
| `src/components/Video/GlobalMiniPlayer.tsx` | SỬA | Swipe dismiss, rainbow border, positioning fix, X button |
| `src/components/Video/YouTubeMobilePlayer.tsx` | SỬA | Cải thiện drag indicator, giảm threshold, haptic |
| `tailwind.config.ts` | SỬA | Thêm keyframes rainbow-border, rainbow-sparkle |

---

## Chi Tiết Triển Khai

### VideoActionsBar.tsx - Redesign Hoàn Chỉnh

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ThumbsUp, ThumbsDown, ExternalLink, Download, Loader2, 
  Bookmark, Bell, BellOff, Share2 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SaveToPlaylistDrawer } from "@/components/Playlist/SaveToPlaylistDrawer";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

// ... props interface stays same

export function VideoActionsBar({ ...props }: VideoActionsBarProps) {
  const { lightTap, successFeedback } = useHapticFeedback();
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  
  const handleLike = () => {
    successFeedback();
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 600);
    onLike();
  };
  
  return (
    <TooltipProvider>
      <div className="px-3 py-3 border-b border-border">
        {/* Channel row - giữ nguyên */}
        
        {/* Actions row - CẢI THIỆN */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* Notification bell dropdown */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-muted/80 h-10 px-3 shrink-0"
          >
            <Bell className="h-5 w-5" />
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
          
          {/* Like/Dislike pill - ENHANCED */}
          <div className="flex items-center bg-muted/80 rounded-full shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={cn(
                      "rounded-full rounded-r-none gap-1.5 h-10 px-4 transition-all duration-300",
                      hasLiked && "text-cosmic-cyan bg-gradient-to-r from-cyan-500/10 to-purple-500/10",
                      showLikeAnimation && "animate-[rainbow-sparkle_0.6s_ease-out]"
                    )}
                  >
                    <ThumbsUp className={cn(
                      "h-5 w-5 transition-all duration-200", 
                      hasLiked && "fill-current scale-110"
                    )} />
                    <span className="font-semibold">{formatNumber(likeCount)}</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{hasLiked ? "Đã thích! 💖" : "Lan tỏa ánh sáng! ✨"}</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-border" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => lightTap()}
              className="rounded-full rounded-l-none h-10 px-4"
            >
              <ThumbsDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Share button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { lightTap(); onShare(); }}
            className="rounded-full bg-muted/80 h-10 px-4 shrink-0"
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {/* Save to playlist - với icon và text */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { lightTap(); setSaveDrawerOpen(true); }}
                className="rounded-full bg-muted/80 h-10 px-4 gap-1.5 shrink-0 hover:bg-primary/10"
              >
                <Bookmark className="h-5 w-5" />
                <span className="text-sm font-medium">Lưu</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lưu vào danh sách phát 📚</p>
            </TooltipContent>
          </Tooltip>

          {/* Download - với status */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { lightTap(); handleDownload(); }}
            disabled={isDownloading}
            className="rounded-full bg-muted/80 h-10 px-4 gap-1.5 shrink-0"
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">Tải xuống</span>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
```

### GlobalMiniPlayer.tsx - Enhanced

```typescript
import { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export function GlobalMiniPlayer() {
  const { lightTap } = useHapticFeedback();
  // ... existing code
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    // Swipe down to dismiss
    if (info.offset.y > 50 || info.velocity.y > 200) {
      lightTap();
      hideMiniPlayer();
    }
  };

  return (
    <AnimatePresence>
      {miniPlayerVideo && isVisible && !shouldHide && (
        <motion.div
          key="mini-player"
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: -30, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className={cn(
            "fixed z-[60]",
            "bottom-[76px] right-3", // Đảm bảo trên MobileBottomNav
            "w-44 rounded-xl overflow-hidden",
            "bg-background/95 backdrop-blur-lg",
            "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
            "border-2 border-transparent",
            "bg-clip-padding",
            "cursor-pointer",
            // Rainbow border effect
            "before:absolute before:inset-0 before:-z-10 before:m-[-2px] before:rounded-xl",
            "before:bg-gradient-to-r before:from-cyan-500 before:via-purple-500 before:to-pink-500",
            "before:animate-[rainbow-border_3s_linear_infinite]"
          )}
          onClick={handleExpand}
        >
          {/* Video */}
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              src={miniPlayerVideo.videoUrl}
              className="w-full h-full object-cover"
              playsInline
              muted={false}
              // ... existing handlers
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            
            {/* Progress bar - thinner, red like YouTube */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
              <div 
                className="h-full bg-red-500 transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Expand button overlay */}
            <div className="absolute top-2 right-2">
              <Maximize2 className="h-4 w-4 text-white/80" />
            </div>
          </div>

          {/* Controls */}
          <div className="p-2 flex items-center gap-1.5 bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-9 w-9 text-foreground hover:bg-accent rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <div className="flex-1 min-w-0 px-1">
              <p className="text-xs font-semibold truncate text-foreground">
                {miniPlayerVideo.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {miniPlayerVideo.channelName}
              </p>
            </div>

            {/* Close button - more prominent */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-white hover:bg-red-500/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### tailwind.config.ts - Thêm Keyframes

```typescript
keyframes: {
  // ... existing keyframes
  
  "rainbow-sparkle": {
    "0%": { 
      boxShadow: "0 0 10px rgba(0,255,255,0.5), 0 0 20px rgba(0,255,255,0.3)" 
    },
    "25%": { 
      boxShadow: "0 0 15px rgba(168,85,247,0.5), 0 0 30px rgba(168,85,247,0.3)" 
    },
    "50%": { 
      boxShadow: "0 0 15px rgba(236,72,153,0.5), 0 0 30px rgba(236,72,153,0.3)" 
    },
    "75%": { 
      boxShadow: "0 0 15px rgba(251,191,36,0.5), 0 0 30px rgba(251,191,36,0.3)" 
    },
    "100%": { 
      boxShadow: "0 0 10px rgba(0,255,255,0.5), 0 0 20px rgba(0,255,255,0.3)" 
    },
  },
  
  "rainbow-border": {
    "0%, 100%": { 
      backgroundPosition: "0% 50%" 
    },
    "50%": { 
      backgroundPosition: "100% 50%" 
    },
  },
},

animation: {
  // ... existing
  "rainbow-sparkle": "rainbow-sparkle 0.6s ease-out",
  "rainbow-border": "rainbow-border 3s linear infinite",
}
```

---

## Kết Quả Mong Đợi

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| Icons action buttons | h-4 w-4, không glow | h-5 w-5, gradient glow, pulse animation |
| Like button | Đổi màu đơn giản | Rainbow sparkle animation, tooltip "Lan tỏa ánh sáng!" |
| Haptic feedback | Không có | Vibrate nhẹ khi bấm tất cả nút |
| Mini-player position | bottom-20, có thể bị che | bottom-[76px], luôn trên MobileBottomNav |
| Mini-player dismiss | Chỉ có nút X | Swipe down hoặc nút X với haptic |
| Mini-player border | border-white/20 đơn giản | Rainbow gradient border animation |
| Progress bar | primary color | Red (YouTube style) |
| Drag indicator | Text đơn giản | Gradient background, icon animate bounce |

---

## Ghi Chú Kỹ Thuật

1. **useHapticFeedback**: Đã có sẵn trong project, dùng `lightTap()` cho tap thường, `successFeedback()` cho like
2. **framer-motion**: Đã có sẵn, dùng cho whileTap scale và drag gestures
3. **TooltipProvider**: Cần wrap trong provider để tooltip hoạt động
4. **z-index**: GlobalMiniPlayer cần z-[60] để luôn trên MobileBottomNav (z-50)
5. **Safe area**: bottom-[76px] = 60px (nav height) + 16px (spacing)
