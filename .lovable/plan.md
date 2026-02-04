
# Kế Hoạch: Sửa Dropdown Chế Độ Hiển Thị → Bottom Sheet

## Vấn Đề Hiện Tại
- Component `CreatePlaylistModal` sử dụng Radix `Select` dropdown
- Trên mobile, dropdown không hiển thị đúng hoặc khó tương tác
- User muốn khi bấm vào ô "Chế độ hiển thị" → mở bottom sheet ở dưới màn hình như YouTube

## Giải Pháp
Thay thế `Select` component bằng button trigger + `Drawer` (bottom sheet) với 3 tùy chọn:

| Tùy chọn | Icon | Mô tả |
|----------|------|-------|
| Công khai | Globe | Mọi người có thể tìm kiếm và xem |
| Không công khai | Link | Bất kỳ ai có đường dẫn liên kết đều có thể xem |
| Riêng tư | Lock | Chỉ bạn mới có thể xem |

---

## UI Flow Mới

```text
[Modal: Danh sách phát mới]
+----------------------------------+
|  X     Danh sách phát mới        |
+----------------------------------+
|  Tiêu đề                         |
|  [________________]              |
|                                  |
|  Chế độ hiển thị                 |
|  ┌─────────────────────────┬──┐  |
|  │ 🔒 Riêng tư             │ ▼│  | <-- Bấm vào đây
|  └─────────────────────────┴──┘  |
|                                  |
|        [Hủy]     [Tạo]           |
+----------------------------------+

          ↓ Khi bấm vào ↓

[Bottom Sheet: Đặt chế độ hiển thị]
+----------------------------------+
|        ═══════════               | <- Drag handle
|  Đặt chế độ hiển thị             |
+----------------------------------+
|  🌐 Công khai                    |
|     Mọi người có thể tìm kiếm    |
+----------------------------------+
|  🔗 Không công khai              |
|     Bất kỳ ai có link có thể xem |
+----------------------------------+
|  🔒 Riêng tư               ✓     | <- Checkmark cho option đang chọn
|     Chỉ bạn mới có thể xem       |
+----------------------------------+
```

---

## Chi Tiết Thay Đổi

### File: `src/components/Playlist/CreatePlaylistModal.tsx`

**Thay đổi imports:**
```typescript
// XÓA
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// THÊM
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ChevronDown, Check } from "lucide-react";
```

**Thêm state mới:**
```typescript
const [visibilityDrawerOpen, setVisibilityDrawerOpen] = useState(false);
```

**Helper function hiển thị visibility:**
```typescript
const getVisibilityDisplay = () => {
  switch (visibility) {
    case "public":
      return { icon: Globe, text: "Công khai" };
    case "unlisted":
      return { icon: Link, text: "Không công khai" };
    case "private":
      return { icon: Lock, text: "Riêng tư" };
  }
};
```

**Thay thế Select bằng Button + Drawer:**
```typescript
{/* Visibility button - opens drawer */}
<div className="space-y-2">
  <Label>Chế độ hiển thị</Label>
  <button
    type="button"
    onClick={() => setVisibilityDrawerOpen(true)}
    className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-left"
  >
    <div className="flex items-center gap-2">
      {React.createElement(getVisibilityDisplay().icon, { className: "h-4 w-4" })}
      <span>{getVisibilityDisplay().text}</span>
    </div>
    <ChevronDown className="h-4 w-4 text-muted-foreground" />
  </button>
</div>

{/* Visibility Drawer */}
<Drawer open={visibilityDrawerOpen} onOpenChange={setVisibilityDrawerOpen}>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Đặt chế độ hiển thị</DrawerTitle>
    </DrawerHeader>
    <div className="p-4 space-y-1">
      {/* Công khai */}
      <button
        onClick={() => { setVisibility("public"); setVisibilityDrawerOpen(false); }}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5" />
          <div className="text-left">
            <p className="font-medium">Công khai</p>
            <p className="text-sm text-muted-foreground">Mọi người có thể tìm kiếm và xem</p>
          </div>
        </div>
        {visibility === "public" && <Check className="h-5 w-5 text-primary" />}
      </button>
      
      {/* Không công khai */}
      <button
        onClick={() => { setVisibility("unlisted"); setVisibilityDrawerOpen(false); }}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <Link className="h-5 w-5" />
          <div className="text-left">
            <p className="font-medium">Không công khai</p>
            <p className="text-sm text-muted-foreground">Bất kỳ ai có đường dẫn liên kết đều có thể xem</p>
          </div>
        </div>
        {visibility === "unlisted" && <Check className="h-5 w-5 text-primary" />}
      </button>
      
      {/* Riêng tư */}
      <button
        onClick={() => { setVisibility("private"); setVisibilityDrawerOpen(false); }}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5" />
          <div className="text-left">
            <p className="font-medium">Riêng tư</p>
            <p className="text-sm text-muted-foreground">Chỉ bạn mới có thể xem</p>
          </div>
        </div>
        {visibility === "private" && <Check className="h-5 w-5 text-primary" />}
      </button>
    </div>
  </DrawerContent>
</Drawer>
```

---

## File Thay Đổi

| File | Loại | Mô tả |
|------|------|-------|
| `src/components/Playlist/CreatePlaylistModal.tsx` | SỬA | Thay Select dropdown bằng Button + Drawer bottom sheet |

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Bấm dropdown → Không xổ ra hoặc hiển thị sai | Bấm → Mở bottom sheet với 3 tùy chọn |
| Chỉ thấy 1 option "Công khai" | Thấy đầy đủ 3 options với mô tả |
| UX khó dùng trên mobile | UX mượt mà, dễ bấm, có checkmark hiển thị lựa chọn |
