

## Sửa lỗi CategoryChips không ghim cố định trên Desktop

### Nguyên nhân

Ở file `src/pages/Index.tsx` (line 321), div gốc của trang có class `overflow-hidden`. Thuộc tính CSS `sticky` sẽ **không hoạt động** khi bất kỳ phần tử cha nào có `overflow: hidden/auto/scroll`.

### Giải pháp

**File: `src/pages/Index.tsx` (line 321)**

Thay `overflow-hidden` thành `overflow-x-hidden` để chỉ ẩn tràn ngang (vẫn giữ mục đích ban đầu) mà không ảnh hưởng đến `sticky` theo chiều dọc.

```
Trước: min-h-screen bg-background relative overflow-hidden
Sau:   min-h-screen bg-background relative overflow-x-hidden
```

Chỉ thay đổi 1 class trong 1 file duy nhất.
