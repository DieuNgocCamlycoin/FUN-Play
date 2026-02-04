
# Kế Hoạch: Hoàn Thiện UI Playlist Giống YouTube

## Tổng Quan Các Vấn Đề

| # | Vấn Đề | Tình Trạng Hiện Tại | Mong Muốn (YouTube) |
|---|--------|---------------------|---------------------|
| 1 | Bottom Sheet Chế độ hiển thị | Nằm ở dưới, bị ẩn, phải scroll | Nổi lên trên cùng màn hình, không cần scroll |
| 2 | Playlist Page Layout | Có số thứ tự, 6-dot icon, không có nút quay lại | Thumbnail full-width top, nút < quay lại, layout gọn |
| 3 | Video List trong Playlist | Có GripVertical, index number, spacing lớn | Vertical clean, thumbnail left-aligned sát trái, no numbers |

---

## Phần 1: Fix Bottom Sheet "Đặt Chế Độ Hiển Thị"

### Vấn Đề Chi Tiết
- `DrawerContent` hiện tại dùng `h-auto` → sheet tự co theo nội dung nhưng bị ẩn dưới viewport
- Không có nút quay lại hoặc đóng rõ ràng

### Giải Pháp
Cập nhật `CreatePlaylistModal.tsx` để drawer nổi đúng vị trí với max-height và back button:

```text
+----------------------------------+
| ← Đặt chế độ hiển thị            |  <- Back button top-left
+----------------------------------+
|                                  |
|  🌐 Công khai               ✓    |
|     Mọi người có thể tìm kiếm    |
+----------------------------------+
|  🔗 Không công khai              |
|     Bất kỳ ai có link có thể xem |
+----------------------------------+
|  🔒 Riêng tư                     |
|     Chỉ bạn mới có thể xem       |
+----------------------------------+
```

### Thay Đổi Code

**File: `src/components/Playlist/CreatePlaylistModal.tsx`**

```typescript
// Cập nhật DrawerContent với max-h-[90vh] và thêm back button
<DrawerContent className="max-h-[90vh]">
  <DrawerHeader className="flex items-center gap-3">
    <button
      onClick={() => {
        lightTap(); // Haptic feedback
        setVisibilityDrawerOpen(false);
      }}
      className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
    <DrawerTitle>Đặt chế độ hiển thị</DrawerTitle>
  </DrawerHeader>
  
  {/* Options với gradient glow trên radio buttons */}
  <div className="p-4 space-y-1 pb-8 overflow-y-auto">
    {/* Options với rainbow glow effect khi selected */}
    <button
      onClick={() => { lightTap(); setVisibility("public"); setVisibilityDrawerOpen(false); }}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl transition-all",
        visibility === "public" 
          ? "bg-gradient-to-r from-primary/10 to-purple-500/10 ring-2 ring-primary/50" 
          : "hover:bg-muted"
      )}
    >
      ...
    </button>
  </div>
</DrawerContent>
```

---

## Phần 2: Redesign Playlist Page Layout

### Vấn Đề Chi Tiết (từ Hình 1 so với Hình 2 YouTube)
- Không có nút `<` quay lại ở top-left
- Thumbnail không full-width trên mobile
- Layout desktop có sidebar trái, mobile cần full-width

### Thiết Kế Mới (Mobile-First như YouTube)

```text
MOBILE VIEW:
+----------------------------------+
| < |        [Cast] [Search] [⋮]   |  <- Header với back button
+----------------------------------+
|                                  |
|     [THUMBNAIL FULL WIDTH]       |
|                       [✏️]       |  <- Edit button góc thumbnail
+----------------------------------+
| LÀM VIỆC VỚI CHA                 |  <- Title bold
| của CAMLY COSMIC COACH - Angel   |
| Danh sách phát • Công khai • 33  |
| LÀM VIỆC VỚI CHA                 |  <- Description
+----------------------------------+
| [▶ Phát tất cả] [+] [✏️] [↗] [⤓] |  <- Action buttons
+----------------------------------+
| [Sort dropdown: Mới nhất ▼]      |
+----------------------------------+
|                                  |
| [THUMB] | MEETING LÀM VIỆC...    |
| 3:35:05 | CAMLY COSMIC COACH     |
|         | (no views/time needed) |
+----------------------------------+
| [THUMB] | MEETING LÀM VIỆC...    |
| 4:00    | CAMLY COSMIC COACH     |
+----------------------------------+
```

### Thay Đổi Code

**File: `src/pages/Playlist.tsx`**

```typescript
// 1. Import thêm
import { ChevronLeft, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

// 2. Trong component
const isMobile = useIsMobile();
const { lightTap } = useHapticFeedback();

// 3. Thêm Back button handler
const handleGoBack = () => {
  lightTap();
  navigate(-1);
};

// 4. Cập nhật Layout - Mobile view khác Desktop
{isMobile ? (
  // MOBILE LAYOUT
  <div className="flex flex-col">
    {/* Back Button Header */}
    <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-2">
        <button 
          onClick={handleGoBack}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        {/* Right icons */}
      </div>
    </div>
    
    {/* Full-width Thumbnail */}
    <div className="relative w-full aspect-video pt-14">
      <img src={thumbnail} className="w-full h-full object-cover" />
      {isOwner && (
        <button className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/90 shadow-lg">
          <Pencil className="h-5 w-5" />
        </button>
      )}
    </div>
    
    {/* Metadata */}
    <div className="p-4">
      <h1 className="text-xl font-bold">{playlist.name}</h1>
      ...
    </div>
    
    {/* Video List - NO numbers, NO grip icons */}
    <div className="px-0">
      {playlist.videos.map((item) => (
        <VideoListItem key={item.id} item={item} showIndex={false} />
      ))}
    </div>
  </div>
) : (
  // DESKTOP LAYOUT (keep existing with improvements)
  ...
)}
```

---

## Phần 3: Clean Video List Display

### Vấn Đề Chi Tiết
- Có `GripVertical` icon (6 chấm)
- Có số thứ tự (1, 2, 3...)
- Video không sát trái
- Spacing lớn

### Thiết Kế Mới (Theo YouTube Mobile)

```text
+--------------------------------------------------+
| [THUMB 16:9] | MEETING LÀM VIỆC CÙNG CHA 7.6... |  <- Title bold, line-clamp-2
| [  3:35:05 ] | CAMLY COSMIC COACH - Angel...    |  <- Channel small
|              |                                  ⋮ |  <- Menu dots
+--------------------------------------------------+
```

### Thay Đổi Code

**File: `src/pages/Playlist.tsx` - Video List Section**

```typescript
// XÓA: GripVertical icon và index number
// CẬP NHẬT: Layout video item

<div className="space-y-0">
  {playlist.videos.map((item, index) => (
    <div
      key={item.id}
      className="flex items-start gap-3 p-2 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => handlePlayVideo(item, index)}
    >
      {/* Thumbnail - LEFT ALIGNED, no margin */}
      <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={item.video.thumbnail_url}
          alt={item.video.title}
          className="w-full h-full object-cover"
        />
        {item.video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(item.video.duration)}
          </span>
        )}
      </div>

      {/* Info - RIGHT SIDE */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
          {item.video.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {item.video.channel_name}
        </p>
      </div>

      {/* Menu dots - only visible on hover or owner */}
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          ...
        </DropdownMenu>
      )}
    </div>
  ))}
</div>
```

---

## Danh Sách File Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Playlist/CreatePlaylistModal.tsx` | SỬA | Fix drawer height, thêm back button, gradient glow cho selected option |
| `src/pages/Playlist.tsx` | SỬA | Redesign mobile layout, thêm back button, xóa index/grip icons, left-align videos |

---

## Chi Tiết Kỹ Thuật

### CreatePlaylistModal.tsx - Cập Nhật Đầy Đủ

```typescript
// Thêm imports
import { ChevronLeft } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

// Trong component
const { lightTap } = useHapticFeedback();

// Drawer với styling mới
<Drawer open={visibilityDrawerOpen} onOpenChange={setVisibilityDrawerOpen}>
  <DrawerContent className="max-h-[85vh] rounded-t-[20px]">
    {/* Header với back button */}
    <DrawerHeader className="flex flex-row items-center gap-2 pb-2">
      <button
        type="button"
        onClick={() => {
          lightTap();
          setVisibilityDrawerOpen(false);
        }}
        className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <DrawerTitle className="flex-1">Đặt chế độ hiển thị</DrawerTitle>
    </DrawerHeader>
    
    <div className="p-4 space-y-2 pb-8 overflow-y-auto">
      {/* Công khai - với gradient glow khi selected */}
      <button
        type="button"
        onClick={() => { 
          lightTap();
          setVisibility("public"); 
          setVisibilityDrawerOpen(false); 
        }}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200",
          visibility === "public" 
            ? "bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 ring-2 ring-cyan-500/30" 
            : "hover:bg-muted"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            visibility === "public" ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white" : "bg-muted"
          )}>
            <Globe className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-medium">Công khai</p>
            <p className="text-sm text-muted-foreground">Mọi người có thể tìm kiếm và xem</p>
          </div>
        </div>
        {visibility === "public" && (
          <Check className="h-5 w-5 text-cyan-500" />
        )}
      </button>
      
      {/* Tương tự cho Không công khai và Riêng tư */}
    </div>
  </DrawerContent>
</Drawer>
```

### Playlist.tsx - Mobile Layout Mới

```typescript
// Thêm imports
import { ChevronLeft, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

// Trong component
const isMobile = useIsMobile();
const { lightTap } = useHapticFeedback();

const handleGoBack = () => {
  lightTap();
  navigate(-1);
};

// MOBILE LAYOUT - trong return statement
return (
  <div className="min-h-screen bg-background">
    {/* Conditional Header based on mobile */}
    {!isMobile && (
      <>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </>
    )}
    
    <main className={cn(
      isMobile ? "pt-0" : "pt-14 lg:pl-64"
    )}>
      {isMobile ? (
        // MOBILE LAYOUT
        <div className="flex flex-col min-h-screen">
          {/* Fixed Back Button */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between p-2 safe-area-top">
              <button 
                onClick={handleGoBack}
                className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-2">
                {/* Cast, Search, More icons */}
              </div>
            </div>
          </div>
          
          {/* Full-width Thumbnail with Edit Button */}
          <div className="relative w-full aspect-video">
            {playlist.videos[0]?.video.thumbnail_url ? (
              <img
                src={playlist.videos[0].video.thumbnail_url}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <Play className="h-16 w-16 text-white/50" />
              </div>
            )}
            
            {/* Gradient overlay bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
            
            {/* Edit Thumbnail Button */}
            {isOwner && (
              <button 
                onClick={() => {
                  lightTap();
                  setEditPlaylistOpen(true);
                }}
                className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
              >
                <Pencil className="h-5 w-5 text-gray-800" />
              </button>
            )}
          </div>
          
          {/* Playlist Info Section */}
          <div className="px-4 py-3 -mt-4 relative z-10">
            <h1 className="text-xl font-bold mb-1">{playlist.name}</h1>
            
            {/* Owner info */}
            {playlist.owner && (
              <p className="text-sm text-muted-foreground mb-1">
                của {playlist.owner.display_name || playlist.owner.username}
              </p>
            )}
            
            {/* Stats line */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <span>Danh sách phát</span>
              <span>•</span>
              <VisibilityIcon className="h-3.5 w-3.5" />
              <span>{visibilityInfo.text}</span>
              <span>•</span>
              <span>{playlist.video_count} video</span>
            </div>
            
            {/* Description */}
            {playlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                {playlist.description}
              </p>
            )}
            
            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePlayAll(false)}
                variant="outline"
                className="flex-1"
                disabled={playlist.videos.length === 0}
              >
                <Play className="h-4 w-4 mr-2 fill-current" />
                Phát tất cả
              </Button>
              
              {/* Circular action buttons */}
              {isOwner && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => { lightTap(); setAddVideoOpen(true); }}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => { lightTap(); setEditPlaylistOpen(true); }}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => { lightTap(); handleShare(); }}
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Sort Dropdown */}
          <div className="px-4 py-2 border-b border-border">
            <Button variant="ghost" size="sm" className="text-sm">
              Ngày xuất bản (mới nhất)
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* Video List - CLEAN, no numbers, no grip */}
          <div className="flex-1">
            {playlist.videos.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-4 py-2 active:bg-muted/50 transition-colors"
                onClick={() => handlePlayVideo(item, index)}
              >
                {/* Thumbnail - LEFT ALIGNED */}
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.video.thumbnail_url || "/placeholder.svg"}
                    alt={item.video.title}
                    className="w-full h-full object-cover"
                  />
                  {item.video.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {formatDuration(item.video.duration)}
                    </span>
                  )}
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {item.video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.video.channel_name}
                  </p>
                </div>

                {/* Menu - visible */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 mt-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVideo(item.video.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa khỏi danh sách
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // DESKTOP LAYOUT - giữ nguyên với cải tiến
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {/* ... existing desktop layout but with removed index numbers ... */}
        </div>
      )}
    </main>
  </div>
);
```

---

## Kết Quả Mong Đợi

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| Bottom Sheet Visibility | Bị ẩn dưới viewport | Nổi lên đầy đủ với max-h-[85vh], có nút < quay lại |
| Playlist Header | Không có back button | Nút < trắng ở góc trái trên thumbnail |
| Thumbnail Top | Nhỏ, trong card | Full-width trên mobile với edit button góc phải |
| Video List | Có số thứ tự, 6-dot grip | Clean vertical, không số, không grip icon |
| Video Alignment | Có padding trái | Left-aligned sát mép trái |
| Haptic Feedback | Không có | Vibrate nhẹ khi bấm nút back/chọn visibility |
| Design System | Đã apply một phần | Gradient glow cho selected options, rainbow hover |

---

## Ghi Chú Thực Thi

1. **useIsMobile hook**: Đã có sẵn trong project để detect mobile viewport
2. **useHapticFeedback hook**: Đã có sẵn, dùng `lightTap()` cho feedback nhẹ
3. **Safe Area**: Thêm `safe-area-top` class cho devices có notch
4. **Drag/Drop trên Desktop**: Giữ nguyên GripVertical cho desktop, chỉ ẩn trên mobile
5. **Responsive**: Mobile dùng full-width layout, Desktop giữ sidebar layout
