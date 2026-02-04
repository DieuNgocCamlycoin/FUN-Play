
# Kế Hoạch: Fix Toàn Diện Video Player - Tất Cả Vấn Đề

## Tổng Quan Các Vấn Đề Cần Fix

| # | Vấn Đề | Tình Trạng | Giải Pháp |
|---|--------|------------|-----------|
| 1 | Nút "Đăng ký" bị khuất/cắt | overflow-x-auto khiến nút cuối bị cắt | Fix layout, đảm bảo min-width và không cắt |
| 2 | Nút "Tải xuống" chỉ hiện 1 phần | Nằm cuối hàng bị cắt | Tăng padding-right, đảm bảo visible |
| 3 | Logic nút chuông sai | Chuông luôn hiển thị riêng biệt | Chưa subscribe → "Đăng ký", Đã subscribe → icon chuông |
| 4 | Đường đỏ chạy nền video | Progress bar đỏ khi controls ẩn | Chuyển sang gradient tím-hồng theo Design System |
| 5 | Chưa có pinch-to-zoom | Thiếu tính năng | Thêm gesture zoom (phức tạp - cần thư viện) |
| 6 | Mini-player chưa mượt | Hoạt động nhưng cần cải thiện | Đảm bảo swipe down, animation mượt |
| 7 | Video bị mất góc/tràn | Layout rối | Reset layout, đảm bảo aspect-ratio 16:9 chuẩn |

---

## 1. Fix Nút "Đăng ký" & Nút Chuông (VideoActionsBar.tsx)

### Vấn Đề Hiện Tại
- Nút Đăng ký nằm ở Channel row (line 125-136) - đúng vị trí
- Có nút Bell riêng biệt trong Actions row (line 142-150) - thừa
- Actions row có `overflow-x-auto` có thể cắt nút cuối

### Giải Pháp
1. **Xóa nút Bell riêng** trong actions row
2. **Thay đổi logic nút Đăng ký**:
   - Chưa subscribe → Nút "Đăng ký" gradient xanh
   - Đã subscribe → Icon chuông (Bell) với dropdown để toggle thông báo
3. **Fix layout** để không bị cắt

```typescript
// Channel row - thay đổi logic
{isSubscribed ? (
  // Hiển thị icon chuông với dropdown
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full h-9 px-3 bg-muted"
      >
        <Bell className="h-5 w-5" />
        <ChevronDown className="h-3 w-3 ml-0.5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => { /* toggle all */ }}>
        <Bell className="mr-2 h-4 w-4" /> Tất cả
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => { /* toggle personalized */ }}>
        <BellRing className="mr-2 h-4 w-4" /> Cá nhân hóa
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => { /* toggle none */ }}>
        <BellOff className="mr-2 h-4 w-4" /> Không nhận
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onSubscribe()}>
        Hủy đăng ký
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  // Hiển thị nút "Đăng ký"
  <Button
    onClick={() => { lightTap(); onSubscribe(); }}
    size="sm"
    className="rounded-full px-4 h-9 font-semibold bg-gradient-to-r from-cosmic-cyan to-cosmic-sapphire text-white shrink-0"
  >
    Đăng ký
  </Button>
)}
```

### Actions Row - Xóa Bell, Fix Layout

```typescript
// Xóa nút Bell riêng (dòng 142-150)
// Thêm padding-right để nút cuối không bị cắt
<div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 pr-4 scrollbar-hide">
  {/* Like/Dislike pill - giữ nguyên */}
  
  {/* Share button - giữ nguyên */}
  
  {/* Save to playlist - giữ nguyên */}
  
  {/* Download - giữ nguyên, đảm bảo không bị cắt */}
</div>
```

---

## 2. Fix Đường Đỏ Progress Bar (YouTubeMobilePlayer.tsx)

### Vấn Đề
- Line 328-334: Progress bar khi controls ẩn dùng `bg-red-600`

### Giải Pháp
- Chuyển sang gradient tím-hồng theo Design System v1.0
- Hoặc dùng `bg-cosmic-cyan` hoặc gradient

```typescript
// Line 326-334 - Thay đổi màu progress bar
{!showControls && (
  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-30">
    <div 
      className="h-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan transition-all duration-100"
      style={{ width: `${progressPercentage}%` }}
    />
  </div>
)}
```

---

## 3. Fix Video Layout - Không Mất Góc (YouTubeMobilePlayer.tsx)

### Vấn Đề
- Video có thể bị crop hoặc tràn màn hình
- `overflow-hidden` có thể cắt góc

### Giải Pháp

```typescript
// Line 306-309 - Cải thiện container className
className={cn(
  "relative bg-black touch-none select-none",
  isFullscreen 
    ? "fixed inset-0 z-[100]" 
    : "aspect-video w-full max-w-full" // Thêm max-w-full
)}

// Video element - Line 313-324
<video
  ref={videoRef}
  src={videoUrl}
  className="w-full h-full object-contain" // Giữ object-contain để không crop
  // ...
/>
```

---

## 4. Cải Thiện Mini-Player (GlobalMiniPlayer.tsx)

### Hiện Tại
- Positioning đúng: `bottom-[76px] right-3`
- Có swipe-to-dismiss
- Có rainbow border animation

### Cải Thiện
- Thêm shadow rõ hơn
- Progress bar theo Design System (không đỏ)

```typescript
// Line 137-142 - Thay đổi màu progress bar trong mini-player
<div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
  <div 
    className="h-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan transition-all duration-200"
    style={{ width: `${progressPercentage}%` }}
  />
</div>
```

---

## 5. Pinch-to-Zoom (Tính năng mới - phức tạp)

### Đánh giá
- Pinch-to-zoom cần gesture handler phức tạp
- Có thể dùng thư viện như `use-gesture` hoặc custom implementation
- Tạm thời: Thêm double-tap zoom 2x đã có (line 179-189)

### Giải pháp đơn giản
- Double-tap đã hoạt động với skip 15s
- Thêm triple-tap để toggle fullscreen có thể là giải pháp thay thế

### Giải pháp nâng cao (để sau)
```typescript
// Cần thêm thư viện @use-gesture/react
import { usePinch } from '@use-gesture/react';

// Trong component
const [scale, setScale] = useState(1);

const bind = usePinch(({ offset: [s] }) => {
  setScale(Math.max(1, Math.min(s, 3))); // Scale từ 1x đến 3x
});
```

---

## Danh Sách File Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Video/Mobile/VideoActionsBar.tsx` | SỬA | Fix logic chuông, xóa Bell thừa, fix layout không bị cắt |
| `src/components/Video/YouTubeMobilePlayer.tsx` | SỬA | Đổi màu progress bar, cải thiện layout |
| `src/components/Video/GlobalMiniPlayer.tsx` | SỬA | Đổi màu progress bar theo Design System |

---

## Chi Tiết Triển Khai

### VideoActionsBar.tsx - Cập Nhật Hoàn Chỉnh

```typescript
// Thêm imports
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BellRing, BellOff } from "lucide-react";

// Trong component - thay đổi Channel row
<div className="flex items-center gap-3">
  {/* Avatar - giữ nguyên */}
  
  {/* Channel info - giữ nguyên */}
  
  {/* Subscribe/Bell button - LOGIC MỚI */}
  {isSubscribed ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => lightTap()}
          className="rounded-full h-9 px-3 bg-muted shrink-0"
        >
          <Bell className="h-5 w-5" />
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          Tất cả thông báo
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BellRing className="mr-2 h-4 w-4" />
          Cá nhân hóa
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BellOff className="mr-2 h-4 w-4" />
          Không nhận
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => { lightTap(); onSubscribe(); }}
          className="text-destructive"
        >
          Hủy đăng ký
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      onClick={() => { lightTap(); onSubscribe(); }}
      size="sm"
      className={cn(
        "rounded-full px-4 h-9 font-semibold shrink-0 transition-all duration-300",
        "bg-gradient-to-r from-cosmic-cyan to-cosmic-sapphire text-white",
        "hover:opacity-90 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
      )}
    >
      Đăng ký
    </Button>
  )}
</div>

{/* Actions row - XÓA nút Bell riêng, thêm pr-4 */}
<div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 pr-4 scrollbar-hide">
  {/* XÓA: Notification bell dropdown (dòng 142-150 cũ) */}
  
  {/* Like/Dislike pill - giữ nguyên */}
  
  {/* Share button - giữ nguyên */}
  
  {/* Save to playlist - giữ nguyên */}
  
  {/* Download - giữ nguyên */}
</div>
```

### YouTubeMobilePlayer.tsx - Progress Bar & Layout

```typescript
// Line 326-334 - Thin progress bar với gradient
{!showControls && (
  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-30">
    <div 
      className="h-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan transition-all duration-100"
      style={{ width: `${progressPercentage}%` }}
    />
  </div>
)}

// Container - Thêm rounded-none để không mất góc
className={cn(
  "relative bg-black touch-none select-none",
  isFullscreen 
    ? "fixed inset-0 z-[100]" 
    : "aspect-video w-full"
)}
```

### GlobalMiniPlayer.tsx - Progress Bar

```typescript
// Line 137-142
<div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
  <div 
    className="h-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan transition-all duration-200"
    style={{ width: `${progressPercentage}%` }}
  />
</div>
```

---

## Kết Quả Mong Đợi

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| Nút Đăng ký | Hiển thị nhưng có thể bị cắt | Hiển thị rõ ràng, không cắt |
| Nút chuông | Luôn hiện riêng biệt | Chỉ hiện SAU khi đã subscribe |
| Nút Tải xuống | Bị cắt cuối hàng | Hiển thị đầy đủ với pr-4 |
| Progress bar đỏ | bg-red-600 | Gradient tím-hồng (cosmic-magenta → cosmic-cyan) |
| Video layout | Có thể bị crop/tràn | Fit vừa khung, aspect-ratio 16:9 |
| Mini-player | Progress đỏ | Gradient theo Design System |
| Pinch-to-zoom | Chưa có | Double-tap zoom đã có, pinch để phiên bản sau |

---

## Ghi Chú Kỹ Thuật

1. **shrink-0**: Thêm vào nút để không bị co lại trong flex container
2. **pr-4**: Padding right cho actions row để nút cuối không bị cắt
3. **Gradient colors**: Dùng `from-cosmic-magenta to-cosmic-cyan` theo Design System v1.0
4. **DropdownMenu**: Import từ `@/components/ui/dropdown-menu` đã có sẵn
5. **Pinch-to-zoom**: Cần thêm thư viện `@use-gesture/react` cho phiên bản nâng cao - để sau

---

## Test Cases

1. Mở video → Kiểm tra nút Đăng ký hiển thị đầy đủ, gradient xanh
2. Bấm Đăng ký → Nút chuyển thành icon chuông với dropdown
3. Bấm chuông → Dropdown hiện các tùy chọn thông báo
4. Scroll actions row → Tất cả nút visible, Download không bị cắt
5. Controls ẩn → Progress bar gradient tím-hồng (không đỏ)
6. Thu nhỏ mini-player → Progress bar gradient tím-hồng
7. Video play → Fit vừa khung 16:9, không mất góc
8. Swipe down trên mini-player → Đóng mượt mà
