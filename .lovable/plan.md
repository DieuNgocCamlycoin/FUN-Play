
# Sửa Lỗi Header Bảng Không Cố Định Khi Cuộn Trang Users Directory

## Nguyên nhân

Component `Table` bọc bảng trong một `<div className="overflow-auto">`, nhưng div này không có chiều cao cố định nên nội dung không cuộn bên trong nó -- toàn bộ trang cuộn thay thế. CSS `sticky top-0` chỉ hoạt động khi phần tử cha có cuộn nội bộ (overflow scroll), nên header bảng không dính lại khi cuộn trang.

## Giải pháp

Đặt chiều cao tối đa cho Card chứa bảng và thêm `overflow-auto` lên Card, biến nó thành vùng cuộn nội bộ. Khi đó `sticky top-0` trên `TableHeader` sẽ hoạt động đúng.

### Tệp: `src/pages/UsersDirectory.tsx`

Thay đổi dòng Card bọc bảng desktop:

**Trước:**
```tsx
<Card>
```

**Sau:**
```tsx
<Card className="max-h-[calc(100vh-220px)] overflow-auto">
```

Điều này tạo một vùng cuộn có chiều cao tối đa (chiều cao màn hình trừ phần header + bộ lọc), và `sticky top-0` trên `TableHeader` sẽ giữ tiêu đề cố định khi cuộn bảng.

| Tệp | Thay đổi |
|------|----------|
| `src/pages/UsersDirectory.tsx` | Thêm `max-h` và `overflow-auto` vào Card bọc bảng desktop |
