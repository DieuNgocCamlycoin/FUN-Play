

## Nâng cấp Watch Page Desktop giống YouTube 95%

### Phân tích hiện trạng vs YouTube

Từ screenshots và code hiện tại, có các vấn đề cần sửa:

| Vấn đề | Hiện tại | YouTube chuẩn |
|---------|----------|---------------|
| Tỷ lệ cột | `1fr / 400px` cố định | ~70% / 30% linh hoạt |
| Sidebar chiều cao | `h-[calc(100vh-320px)]` cố định trong ScrollArea, gây dư trắng | Sidebar kéo dài tự nhiên, sticky khi scroll |
| Comment preview | Hiển thị toàn bộ nội dung | Giới hạn 3 dòng + "Xem thêm" / "Thu gọn" |
| Reply indent | `border-l-2 pl-3` | Thụt vào 24px rõ ràng hơn |
| Sidebar sticky | Chỉ sticky container | Sticky và hiển thị song song khi scroll comment |

### Các thay đổi cụ thể

#### 1. Watch.tsx - Cải thiện layout grid (70/30)

- Thay `grid-cols-[1fr_400px]` bằng `grid-cols-[1fr_402px]` hoặc tốt hơn: `grid-cols-[minmax(0,1fr)_minmax(300px,402px)]`
- Giảm gap từ `gap-6` xuống `gap-4` cho compact hơn
- Sidebar wrapper: bỏ `lg:sticky lg:top-[72px]` đơn giản, thay bằng sticky với `self-start` và `max-h-[calc(100vh-80px)] overflow-y-auto`

#### 2. UpNextSidebar.tsx - Bỏ ScrollArea cố định, dùng sticky tự nhiên

- Xóa `ScrollArea` với `h-[calc(100vh-320px)]` gây giới hạn chiều cao
- Thay bằng div thường, để sidebar kéo dài tự nhiên theo nội dung
- Wrapper sticky ở Watch.tsx sẽ lo việc sticky + scroll

#### 3. VideoCommentItem.tsx - Giới hạn 3 dòng + Xem thêm

- Thêm state `isExpanded` cho nội dung comment
- Mặc định: `line-clamp-3` trên `CommentContent`
- Nếu nội dung dài (>150 ký tự): hiển thị nút "Xem thêm" / "Thu gọn"
- Reply thread: thay `pl-3` bằng `pl-6` (24px) cho đúng chuẩn YouTube

#### 4. VideoCommentList.tsx - Sort dropdown chuẩn YouTube

- Đảm bảo sort dropdown hiển thị "Mới nhất" / "Nổi bật" đúng vị trí (cạnh số bình luận)

### Chi tiết kỹ thuật

**Watch.tsx (line 696):**
```
// Cũ:
grid-cols-1 lg:grid-cols-[1fr_400px] lg:items-start

// Mới:
grid-cols-1 lg:grid-cols-[1fr_minmax(300px,402px)]
```

**Watch.tsx (line 966):**
```
// Cũ:
<div className="lg:sticky lg:top-[72px]">

// Mới:
<div className="lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:scrollbar-thin">
```

**UpNextSidebar.tsx (line 221):**
```
// Cũ:
<ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">

// Mới:
<div className="space-y-1">
```
Bỏ ScrollArea, để nội dung tự nhiên. Sidebar sticky wrapper sẽ lo overflow.

**VideoCommentItem.tsx (line 175-178):**
```
// Cũ: hiển thị toàn bộ
<div className="text-sm text-foreground mb-2">
  <CommentContent content={comment.content} />
</div>

// Mới: giới hạn 3 dòng
const [isContentExpanded, setIsContentExpanded] = useState(false);
const isLongContent = comment.content.length > 150;

<div className="text-sm text-foreground mb-2">
  <div className={!isContentExpanded && isLongContent ? "line-clamp-3" : ""}>
    <CommentContent content={comment.content} />
  </div>
  {isLongContent && (
    <button onClick={() => setIsContentExpanded(!isContentExpanded)} 
            className="text-xs font-semibold text-muted-foreground mt-1">
      {isContentExpanded ? "Thu gọn" : "Đọc thêm"}
    </button>
  )}
</div>
```

**VideoCommentItem.tsx (line 325) - Reply indent 24px:**
```
// Cũ:
className="mt-2 space-y-4 border-l-2 border-muted pl-3"

// Mới:
className="mt-2 space-y-4 pl-6"
```

### Các tệp cần thay đổi

| STT | Tệp | Nội dung |
|-----|------|----------|
| 1 | `src/pages/Watch.tsx` | Grid 70/30, sidebar sticky cải thiện |
| 2 | `src/components/Video/UpNextSidebar.tsx` | Bỏ ScrollArea cố định, dùng div tự nhiên |
| 3 | `src/components/Video/Comments/VideoCommentItem.tsx` | Comment 3 dòng + Xem thêm, reply indent 24px |

### Kết quả mong đợi

- Video player chiếm full 70% cột trái, aspect ratio 16:9
- Sidebar 30% sticky khi scroll, kéo dài song song comment
- Comment preview tối đa 3 dòng với nút "Đọc thêm" / "Thu gọn"
- Reply thread thụt vào 24px rõ ràng
- Không còn khoảng trống dư dưới sidebar
- Trải nghiệm giống YouTube 95% trên desktop

