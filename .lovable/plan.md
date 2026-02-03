

# Kế Hoạch Nâng Cấp Trang Xem Video Mobile - YouTube Style UX

## Tổng Quan Phân Tích

Dựa trên 7 hình ảnh YouTube mobile con gửi và codebase hiện tại, Cha xác định các điểm cần nâng cấp:

| Tính năng | Hiện tại (FUN PLAY) | YouTube (Mục tiêu) |
|-----------|---------------------|---------------------|
| Nút quay lại trang chủ | Không có | Có mũi tên ˅ (minimize) góc trái |
| Mini player khi minimize | Chỉ khi scroll xuống | Kéo video xuống hoặc bấm ˅ |
| Tiêu đề video | 1 dòng | Max 2 dòng + "..." |
| Thông tin video | Lượt xem + ngày riêng biệt | Lượt xem + ngày + "...xem thêm" |
| Action buttons | Nằm ngang | Có Download button |
| Comments | Hiển thị đầy đủ | Card preview + drawer xổ ra |
| Player controls | Đầy đủ nhưng layout khác | Chuẩn YouTube layout |
| Double-tap skip | 10 giây | 15 giây (theo yêu cầu) |
| Fullscreen | Có | Có + responsive dọc/ngang |

---

## Kiến Trúc Mới - Component Structure

```text
Watch.tsx (Mobile mode)
    └── MobileWatchView (NEW - container cho mobile)
            │
            ├── YouTubeMobilePlayer (ENHANCED)
            │       ├── Minimize button (˅) góc trái
            │       ├── Settings góc phải
            │       ├── Center: Play + Prev/Next (double-tap 15s)
            │       ├── Bottom: Time + Fullscreen
            │       └── Drag-to-minimize gesture
            │
            ├── VideoInfoSection (NEW)
            │       ├── Title (max 2 lines + ...)
            │       ├── Views + Date + "...xem thêm"
            │       └── DescriptionDrawer (NEW - slide up)
            │
            ├── VideoActionsBar (NEW)
            │       ├── Avatar + Subscribe button
            │       ├── Like + Dislike
            │       ├── Share
            │       └── Download button (NEW)
            │
            ├── CommentsCard (NEW)
            │       ├── "Bình luận X" header
            │       ├── Preview 1 comment
            │       └── Click → CommentsDrawer
            │
            ├── CommentsDrawer (NEW - bottom sheet)
            │       ├── Full comments list
            │       ├── Add comment input
            │       └── Reply to comment
            │
            ├── RelatedVideos (existing - UpNextSidebar)
            │
            └── FloatingMiniPlayer (ENHANCED)
                    ├── Position: bottom-right
                    ├── Play/Pause + Close
                    └── Tap to expand
```

---

## Phase 1: Tạo YouTubeMobilePlayer Component

### File mới: `src/components/Video/YouTubeMobilePlayer.tsx`

**Layout controls (như YouTube hình 3, 4, 6):**

```text
┌────────────────────────────────────────────────┐
│ ˅ (minimize)              ⏺ CC ⚙️ (settings) │
│                                                │
│                                                │
│             ◀︎    ▶︎/⏸    ▶︎                  │
│           prev  play/pause  next              │
│                                                │
│                                                │
│ 0:05 / 2:44:44                         ⛶     │
└────────────────────────────────────────────────┘
```

**Tính năng chính:**
- **Mũi tên ˅ góc trên trái**: Bấm → minimize video thành mini player + hiện trang chủ
- **Settings góc phải**: Không còn tên video (đã có ở dưới)
- **Center controls**: Previous | Play/Pause | Next
- **Double-tap**: 15 giây (thay vì 10s như hiện tại)
- **Time display góc dưới trái**: `0:05 / 2:44:44`
- **Fullscreen góc dưới phải**: Phóng to theo orientation (dọc/ngang)
- **Drag-to-minimize**: Kéo giữ video → kéo xuống → minimize

---

## Phase 2: Tạo VideoInfoSection + DescriptionDrawer

### File mới: `src/components/Video/Mobile/VideoInfoSection.tsx`

**Layout (như YouTube hình 3, 4):**
```text
Cô Gái Sở Hữu Dị Năng Xuyên Thành Công Chú...
@CapyReview-y3k  308 N lượt xem  3 tuần  ...xem thêm
```

**Tính năng:**
- **Tiêu đề**: Max 2 dòng, overflow → `...`
- **Thông tin**: Channel name + Views + Date + "...xem thêm"
- **Click "xem thêm"**: Mở DescriptionDrawer (slide từ dưới lên)

### File mới: `src/components/Video/Mobile/DescriptionDrawer.tsx`

**Layout (như YouTube hình 5):**
- Header: "Nội dung mô tả" + nút X
- Tiêu đề đầy đủ (không cắt)
- 3 stats: Lượt thích | Lượt xem | Ngày đăng
- Hashtags (#thaituphi #vuongphicodai ...)
- Description text đầy đủ
- Scrollable

---

## Phase 3: Tạo VideoActionsBar Component

### File mới: `src/components/Video/Mobile/VideoActionsBar.tsx`

**Layout (như YouTube hình 3, 4, 6):**
```text
[Avatar] Đăng ký  |  👍 20 N  👎  |  ➦ Share  |  ↓ Tải xuống
```

**Tính năng:**
- **Avatar kênh**: Clickable → Channel page
- **Đăng ký button**: Gradient xanh / xám
- **Like + Dislike**: Hiển thị số
- **Share button**: Mở ShareModal
- **Download button (NEW)**: Tải video để xem offline
  - Lưu vào IndexedDB hoặc localStorage reference
  - Trang "Video đã tải" để quản lý

---

## Phase 4: Tạo CommentsCard + CommentsDrawer

### File mới: `src/components/Video/Mobile/CommentsCard.tsx`

**Layout (như YouTube hình 3, 6):**
```text
┌─────────────────────────────────────┐
│ Bình luận  784                      │
│ [Avatar] Thời này có ghế nhựa       │
└─────────────────────────────────────┘
```

**Tính năng:**
- Card clickable
- Hiển thị số bình luận
- Preview 1 comment mới nhất
- Click → Mở CommentsDrawer

### File mới: `src/components/Video/Mobile/CommentsDrawer.tsx`

**Layout (slide từ dưới lên, 80% height):**
- Header: "Bình luận" + số lượng + nút X
- Input viết bình luận (bottom fixed)
- Scrollable list comments
- Mỗi comment có:
  - Avatar + Name + Date
  - Content
  - Like/Dislike
  - Reply button → nested replies

---

## Phase 5: Nâng Cấp FloatingMiniPlayer

### File sửa: `src/components/Video/MiniPlayer.tsx`

**Layout mới (như YouTube hình 7):**
- **Vị trí**: Bottom-right (thay vì bottom full-width)
- **Size**: ~150x100px
- **Controls**: Play/Pause + Close (X)
- **Click video**: Expand trở lại Watch page
- **Drag**: Có thể kéo di chuyển vị trí

**Trigger mini player:**
1. Bấm mũi tên ˅ trên video player
2. Kéo giữ video và kéo xuống (swipe down gesture)

---

## Phase 6: Sửa Watch.tsx - Tích Hợp Mobile View

### File sửa: `src/pages/Watch.tsx`

**Thay đổi:**
- Detect `isMobile` → render `MobileWatchView` thay vì layout desktop
- Truyền props cho các component mới
- Handle minimize/expand state
- Navigate về trang chủ khi minimize

**State management:**
```typescript
const [isMinimized, setIsMinimized] = useState(false);
const [showDescriptionDrawer, setShowDescriptionDrawer] = useState(false);
const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
```

---

## Chi Tiết Kỹ Thuật

### 1. Drag-to-Minimize Gesture

```typescript
const handleDragEnd = (event, info) => {
  // Nếu kéo xuống > 100px → minimize
  if (info.offset.y > 100) {
    setIsMinimized(true);
    // Navigate về trang chủ với mini player active
    navigate('/', { state: { miniPlayerVideo: video } });
  }
};
```

### 2. Double-Tap Skip 15 giây

```typescript
// Thay đổi từ 10s → 15s
const SKIP_SECONDS = 15;

if (isLeftHalf) {
  seekRelative(-SKIP_SECONDS);
} else {
  seekRelative(SKIP_SECONDS);
}
```

### 3. Responsive Fullscreen

```typescript
const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await container.requestFullscreen();
    // Lock orientation theo video aspect ratio
    const isPortrait = videoHeight > videoWidth;
    if (screen.orientation?.lock) {
      await screen.orientation.lock(isPortrait ? 'portrait' : 'landscape');
    }
  }
};
```

### 4. Download Video Feature

```typescript
const handleDownload = async () => {
  // 1. Fetch video blob
  const response = await fetch(video.video_url);
  const blob = await response.blob();
  
  // 2. Save to IndexedDB
  await saveToOfflineStorage(video.id, {
    blob,
    title: video.title,
    thumbnail: video.thumbnail_url,
    downloadedAt: new Date(),
  });
  
  toast({
    title: "Đã tải xuống",
    description: "Video đã được lưu để xem offline",
  });
};
```

---

## Tóm Tắt Files Cần Tạo/Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `src/components/Video/YouTubeMobilePlayer.tsx` | NEW | Player mới với layout YouTube |
| `src/components/Video/Mobile/VideoInfoSection.tsx` | NEW | Tiêu đề + views + xem thêm |
| `src/components/Video/Mobile/DescriptionDrawer.tsx` | NEW | Drawer mô tả video |
| `src/components/Video/Mobile/VideoActionsBar.tsx` | NEW | Actions: Subscribe, Like, Share, Download |
| `src/components/Video/Mobile/CommentsCard.tsx` | NEW | Card preview bình luận |
| `src/components/Video/Mobile/CommentsDrawer.tsx` | NEW | Drawer full bình luận |
| `src/components/Video/Mobile/MobileWatchView.tsx` | NEW | Container cho mobile watch |
| `src/components/Video/MiniPlayer.tsx` | EDIT | Nâng cấp layout + position |
| `src/pages/Watch.tsx` | EDIT | Tích hợp mobile view |
| `src/hooks/useOfflineVideos.ts` | NEW | Hook quản lý video offline |

---

## UI/UX Guidelines (Design System v1.0)

### Navigation nhất quán:
- Mũi tên ˅ (minimize) luôn ở góc trái video player
- Drawer slide từ dưới lên với animation mượt
- Mini player có shadow + rainbow border nhẹ

### Touch-friendly:
- Tất cả buttons: min-height 48px
- Swipe gestures responsive
- Double-tap zones rõ ràng (trái/phải)

### Animations:
- Fade khi toggle controls
- Slide-up cho drawers
- Scale effect cho mini player
- Pulse glow cho Like/Subscribe buttons

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

| Tính năng | Kết quả |
|-----------|---------|
| Minimize video | Bấm ˅ hoặc kéo xuống → Mini player + trang chủ |
| Tiêu đề video | Max 2 dòng, overflow → "..." |
| Xem thêm | Click → Drawer mô tả đầy đủ |
| Bình luận | Card preview → Click → Drawer đầy đủ |
| Download | Tải video xem offline |
| Double-tap | Skip ±15 giây |
| Fullscreen | Responsive dọc/ngang |

---

## Thứ Tự Triển Khai

1. Tạo `YouTubeMobilePlayer.tsx` với layout mới + gestures
2. Tạo `VideoInfoSection.tsx` + `DescriptionDrawer.tsx`
3. Tạo `VideoActionsBar.tsx` + Download feature
4. Tạo `CommentsCard.tsx` + `CommentsDrawer.tsx`
5. Nâng cấp `MiniPlayer.tsx`
6. Tạo `MobileWatchView.tsx` tổng hợp
7. Sửa `Watch.tsx` tích hợp mobile view
8. Test end-to-end trên mobile

