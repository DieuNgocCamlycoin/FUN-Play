

## Thêm "Lịch sử báo cáo" vào Sidebar

### Thay đổi

Thêm mục **"Lịch sử báo cáo"** với icon `Flag` vào nhóm **Thư viện** trong `CollapsibleSidebar.tsx`, vì nhóm này chứa các mục liên quan đến nội dung cá nhân của user (Thư viện, Lịch sử, Video đã thích...).

### Chi tiết kỹ thuật

**File: `src/components/Layout/CollapsibleSidebar.tsx`**

1. Thêm import `Flag` từ `lucide-react` (dòng 2)
2. Thêm item mới vào mảng `libraryItems` (sau dòng 63):
   ```
   { icon: Flag, label: "Lịch sử báo cáo", href: "/my-reports" }
   ```

Không cần thay đổi file nào khác -- route `/my-reports` đã tồn tại trong `App.tsx`.

| File | Thay đổi |
|------|---------|
| `src/components/Layout/CollapsibleSidebar.tsx` | Import Flag, thêm "Lịch sử báo cáo" vào libraryItems |

