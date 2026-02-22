

## Bỏ gạch ngang và grayscale trên trang /suspended

### Vấn đề hiện tại
Trên trang Danh sách đình chỉ (`/suspended`), tên người dùng bị gạch ngang (`line-through`) và avatar bị làm mờ trắng đen (`opacity-40 grayscale`). Theo yêu cầu, cần hiển thị bình thường như ảnh tham chiếu.

### Thay đổi

**File: `src/pages/SuspendedUsers.tsx`**

1. **Dòng 170**: Bỏ `opacity-40 grayscale` khỏi class Avatar
   - Trước: `<Avatar className="h-9 w-9 opacity-40 grayscale shrink-0">`
   - Sau: `<Avatar className="h-9 w-9 shrink-0">`

2. **Dòng 179**: Bỏ `line-through decoration-destructive/50` khỏi tên orphan
   - Trước: `className="font-medium text-sm text-foreground line-through decoration-destructive/50 truncate"`
   - Sau: `className="font-medium text-sm text-foreground truncate"`

3. **Dòng 184**: Bỏ `line-through decoration-destructive/50` khỏi tên user
   - Trước: `className="font-medium text-sm text-foreground line-through decoration-destructive/50 truncate group-hover:underline group-hover:text-primary transition-colors"`
   - Sau: `className="font-medium text-sm text-foreground truncate group-hover:underline group-hover:text-primary transition-colors"`

Chỉ thay đổi hiển thị, không ảnh hưởng logic hay dữ liệu.
