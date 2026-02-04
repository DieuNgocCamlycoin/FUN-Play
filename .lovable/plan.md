
# Kế Hoạch: Hoàn Thiện Trang Danh Sách Phát

## Tổng Quan
Triển khai các cải tiến theo mẫu YouTube mobile:
1. Thêm 3 chế độ hiển thị trong modal tạo playlist
2. Cải thiện layout video list trong playlist page
3. Thêm nút edit thumbnail trên ảnh đại diện
4. Cải thiện action bar với các nút mới

---

## Phần 1: Cập Nhật Chế Độ Hiển Thị

### Vấn đề hiện tại
Modal CreatePlaylistModal chỉ có 2 tùy chọn: "Riêng tư" và "Công khai"

### Giải pháp
Thêm 3 chế độ hiển thị theo YouTube:
- **Công khai** (mặc định): Mọi người đều có thể xem
- **Không công khai**: Chỉ những người có link mới xem được  
- **Riêng tư**: Chỉ bạn có thể xem

### Thay đổi Database
Cần thêm cột `visibility` hoặc sử dụng logic kết hợp `is_public` + cột mới

| Giá trị | is_public | Ý nghĩa |
|---------|-----------|---------|
| public | true | Công khai - hiển thị trong tìm kiếm |
| unlisted | null | Không công khai - chỉ xem qua link |
| private | false | Riêng tư - chỉ chủ sở hữu xem |

### File cần sửa

| File | Thay đổi |
|------|----------|
| `src/components/Playlist/CreatePlaylistModal.tsx` | Thêm option "Không công khai", đổi mặc định thành "public" |
| `src/pages/Playlist.tsx` | Cập nhật hiển thị visibility text |

---

## Phần 2: Cải Thiện Layout Video List

### Vấn đề hiện tại
- Tiêu đề video bị tràn ra ngoài
- Thiếu thông tin lượt xem và thời gian đăng

### Thiết kế mới (theo YouTube mobile)

```text
+--------------------------------------------------+
| [Thumb 16:9] | Tiêu đề video dài quá thì...      |
| [  47:34   ] | Tên kênh                           |
|              | 274 lượt xem • 2 ngày trước    [⋮] |
+--------------------------------------------------+
```

### Thay đổi code

```typescript
// Playlist.tsx - Video item layout
<div className="flex gap-3 p-2">
  {/* Thumbnail nhỏ bên trái */}
  <div className="relative w-32 md:w-40 aspect-video flex-shrink-0">
    <img src={thumbnail} className="rounded" />
    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
      47:34
    </span>
  </div>
  
  {/* Info bên phải */}
  <div className="flex-1 min-w-0">
    <h3 className="font-medium line-clamp-2 text-sm">{title}</h3>
    <p className="text-xs text-muted-foreground mt-1">{channelName}</p>
    <p className="text-xs text-muted-foreground">
      {viewCount} lượt xem • {timeAgo}
    </p>
  </div>
</div>
```

---

## Phần 3: Nút Edit Thumbnail trên Ảnh Đại Diện

### Vị trí
Góc dưới bên phải của thumbnail playlist (nút tròn nhỏ với icon bút)

### Chức năng
Khi bấm, mở modal chọn thumbnail với các tùy chọn:
- Chọn từ video trong playlist
- Upload ảnh tùy chỉnh (nếu cần)

### Thay đổi code

```typescript
// Playlist.tsx - Thumbnail section
<div className="relative aspect-video rounded-lg overflow-hidden">
  <img src={thumbnailUrl} />
  
  {/* Edit button - chỉ hiện cho owner */}
  {isOwner && (
    <button 
      className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-background/90 shadow-lg flex items-center justify-center hover:bg-background"
      onClick={() => setEditThumbnailOpen(true)}
    >
      <Pencil className="h-5 w-5" />
    </button>
  )}
</div>
```

---

## Phần 4: Cập Nhật Action Bar

### Layout mới (theo YouTube mobile)

```text
[▶ Phát tất cả] [+] [✏️] [↗] [⤓]
     (nhỏ)     Thêm Edit Share Download
               video
```

### Các nút mới

| Nút | Icon | Chức năng |
|-----|------|-----------|
| Phát tất cả | Play | Phát toàn bộ playlist (nhỏ hơn, không full width) |
| + | Plus | Mở modal tìm và thêm video vào playlist |
| ✏️ | Pencil | Chỉnh sửa thông tin playlist |
| ↗ | ExternalLink | Chia sẻ link playlist |
| ⤓ | Download | Tải xuống (nếu có) |

### Thay đổi code

```typescript
// Playlist.tsx - Action buttons
<div className="flex items-center gap-2 mt-4">
  {/* Nút phát - nhỏ hơn */}
  <Button 
    onClick={() => handlePlayAll(false)}
    className="flex-1 max-w-[200px]"
    disabled={videos.length === 0}
  >
    <Play className="h-4 w-4 mr-2" />
    Phát tất cả
  </Button>
  
  {/* Các nút tròn */}
  {isOwner && (
    <>
      <Button variant="outline" size="icon" className="rounded-full" onClick={() => setAddVideoOpen(true)}>
        <Plus className="h-5 w-5" />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full" onClick={() => setEditPlaylistOpen(true)}>
        <Pencil className="h-5 w-5" />
      </Button>
    </>
  )}
  <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
    <ExternalLink className="h-5 w-5" />
  </Button>
</div>
```

---

## Danh Sách File Thay Đổi

| File | Loại | Mô tả |
|------|------|-------|
| `src/components/Playlist/CreatePlaylistModal.tsx` | SỬA | Thêm 3 chế độ hiển thị, mặc định "Công khai" |
| `src/pages/Playlist.tsx` | SỬA | Cập nhật layout video, thêm nút edit thumbnail, cải thiện action bar |
| `src/components/Playlist/AddVideoToPlaylistModal.tsx` | TẠO MỚI | Modal tìm và thêm video |
| `src/components/Playlist/EditPlaylistThumbnailModal.tsx` | TẠO MỚI | Modal chọn thumbnail |

---

## Chi Tiết Triển Khai

### CreatePlaylistModal.tsx

```typescript
// Visibility state - đổi type
const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");

// Cập nhật Select
<Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "unlisted" | "private")}>
  <SelectContent>
    <SelectItem value="public">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <span>Công khai</span>
      </div>
    </SelectItem>
    <SelectItem value="unlisted">
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4" />
        <span>Không công khai</span>
      </div>
    </SelectItem>
    <SelectItem value="private">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        <span>Riêng tư</span>
      </div>
    </SelectItem>
  </SelectContent>
</Select>

// Khi save - map visibility to is_public
const is_public = visibility === "public" ? true : visibility === "private" ? false : null;
```

### Playlist.tsx - Visibility Display

```typescript
// Helper function
const getVisibilityText = (is_public: boolean | null) => {
  if (is_public === true) return { icon: Globe, text: "Công khai" };
  if (is_public === false) return { icon: Lock, text: "Riêng tư" };
  return { icon: Link, text: "Không công khai" };
};
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Chỉ có 2 chế độ: Riêng tư, Công khai | 3 chế độ: Công khai (mặc định), Không công khai, Riêng tư |
| Mặc định là "Riêng tư" | Mặc định là "Công khai" |
| Tiêu đề video bị tràn | Tiêu đề truncate với "..." |
| Thiếu thông tin views/time | Hiển thị đầy đủ: views • thời gian đăng |
| Không có nút edit thumbnail | Nút bút tròn ở góc thumbnail |
| Nút "Phát tất cả" quá to | Nút nhỏ hơn + thêm các nút +, edit, share |
