
# Kế Hoạch: Tối Ưu Modal Tạo Playlist & Nút Lưu Video

## Tổng Quan
Triển khai 2 tính năng theo mẫu YouTube:
1. Modal "Tạo danh sách phát mới" gọn gàng khi bấm nút "+"
2. Nút "Lưu" dưới mỗi video với bottom sheet hiển thị danh sách playlist

---

## Tính Năng 1: Modal Tạo Playlist Tối Ưu

### Mục tiêu
Khi bấm nút "+" ở mục Danh sách phát trên trang Profile, hiển thị modal nhỏ gọn với:
- Tiêu đề "Danh sách phát mới"
- Ô nhập "Tiêu đề" 
- Dropdown "Chế độ hiển thị" (Công khai / Riêng tư)
- Nút "Hủy" và "Tạo"
- Dấu X để đóng modal

### Thay đổi code

| File | Thay đổi |
|------|----------|
| `src/components/Playlist/CreatePlaylistModal.tsx` | **TẠO MỚI** - Component modal nhỏ gọn |
| `src/pages/Profile.tsx` | Thêm state và import modal mới |
| `src/pages/ManagePlaylists.tsx` | Sử dụng modal mới thay cho dialog hiện tại |

### Component mới: CreatePlaylistModal

```text
+----------------------------------+
|  X     Danh sách phát mới        |
+----------------------------------+
|  ┌────────────────────────────┐  |
|  │ Tiêu đề                    │  |
|  │ [________________]         │  |
|  └────────────────────────────┘  |
|                                  |
|  Chế độ hiển thị                 |
|  ┌─────────────────────────┬──┐  |
|  │ Riêng tư                │ ▼│  |
|  └─────────────────────────┴──┘  |
|                                  |
|        [Hủy]     [Tạo]           |
+----------------------------------+
```

---

## Tính Năng 2: Nút "Lưu" Video + Bottom Sheet

### Mục tiêu
Thêm nút "Lưu" (bookmark icon) vào thanh actions dưới video, hiển thị bottom sheet với:
- Tiêu đề "Lưu vào..."
- Danh sách playlist với thumbnail, tên, trạng thái (Công khai/Riêng tư)
- Icon bookmark để toggle lưu/bỏ lưu
- Nút "+ Danh sách phát mới" ở cuối

### Thay đổi code

| File | Thay đổi |
|------|----------|
| `src/components/Video/Mobile/VideoActionsBar.tsx` | Thêm nút "Lưu", đổi icon Share thành mũi tên |
| `src/components/Playlist/SaveToPlaylistDrawer.tsx` | **TẠO MỚI** - Bottom sheet kiểu YouTube |

### UI cập nhật VideoActionsBar

```text
Trước:  [Like/Dislike] [Chia sẻ] [Tải xuống]
Sau:    [Like/Dislike] [↗ Share] [Lưu] [Tải xuống]
```

### Component mới: SaveToPlaylistDrawer

```text
+----------------------------------+
|        ═══════════               | <- Drag handle
|  Lưu vào...                      |
+----------------------------------+
|  [thumbnail] Watch later         |
|              Riêng tư       [📑] |
+----------------------------------+
|  [thumbnail] Love                |
|              Công khai      [📑] |
+----------------------------------+
|  [thumbnail] Background & music  |
|              Công khai      [📑] |
+----------------------------------+
|  ...more playlists...            |
+----------------------------------+
|  + Danh sách phát mới            |
+----------------------------------+
```

---

## Chi Tiết Triển Khai

### 1. CreatePlaylistModal.tsx (Component mới)

```typescript
// Props interface
interface CreatePlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (playlistId: string) => void;
}

// State
- name: string (tiêu đề playlist)
- visibility: "public" | "private"
- saving: boolean

// UI Elements
- Dialog với max-w-sm
- Input cho tiêu đề
- Select dropdown cho chế độ hiển thị
- Button Hủy/Tạo
- X button ở góc
```

### 2. SaveToPlaylistDrawer.tsx (Component mới)

```typescript
// Props interface
interface SaveToPlaylistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle?: string;
}

// Features
- Sử dụng Drawer component (vaul)
- Fetch playlist với thumbnail đầu tiên
- Toggle save/unsave với animation
- Tích hợp CreatePlaylistModal khi bấm "+ Danh sách phát mới"
```

### 3. VideoActionsBar.tsx (Cập nhật)

```typescript
// Thêm imports
import { Bookmark } from "lucide-react";
import { SaveToPlaylistDrawer } from "@/components/Playlist/SaveToPlaylistDrawer";

// Thêm state
const [saveDrawerOpen, setSaveDrawerOpen] = useState(false);

// Cập nhật UI
// Share button: đổi từ <Share2> sang biểu tượng mũi tên ↗
// Thêm nút Lưu trước nút Tải xuống
```

### 4. Profile.tsx (Cập nhật)

```typescript
// Thêm import
import { CreatePlaylistModal } from "@/components/Playlist/CreatePlaylistModal";

// Thêm state
const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);

// Cập nhật nút "+"
<Button onClick={() => setCreatePlaylistOpen(true)}>
  <Plus />
</Button>

// Thêm modal
<CreatePlaylistModal 
  open={createPlaylistOpen} 
  onOpenChange={setCreatePlaylistOpen}
  onCreated={() => fetchData()}
/>
```

---

## Danh sách file thay đổi

| File | Loại | Mô tả |
|------|------|-------|
| `src/components/Playlist/CreatePlaylistModal.tsx` | TẠO MỚI | Modal tạo playlist nhỏ gọn |
| `src/components/Playlist/SaveToPlaylistDrawer.tsx` | TẠO MỚI | Bottom sheet lưu video |
| `src/pages/Profile.tsx` | CẬP NHẬT | Sử dụng CreatePlaylistModal |
| `src/pages/ManagePlaylists.tsx` | CẬP NHẬT | Sử dụng CreatePlaylistModal |
| `src/components/Video/Mobile/VideoActionsBar.tsx` | CẬP NHẬT | Thêm nút Lưu, đổi icon Share |

---

## Kết quả mong đợi

| Trước | Sau |
|-------|-----|
| Bấm "+" → Chuyển trang ManagePlaylists | Bấm "+" → Hiện modal nhỏ gọn ngay tại chỗ |
| Không có nút Lưu dưới video | Có nút "Lưu" với bottom sheet playlist |
| Share hiển thị text "Chia sẻ" | Share hiển thị icon mũi tên ↗ |
| Modal tạo playlist có nhiều field | Modal gọn: chỉ Tiêu đề + Chế độ hiển thị |
