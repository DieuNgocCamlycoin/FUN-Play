

# Sửa Header Bảng Cố Định Trong Users Directory

## Nguyên nhân gốc

Component `Table` (dòng 7) bọc `<table>` trong một `<div className="relative w-full overflow-auto">`. Thuộc tính `overflow-auto` trên div trung gian này **phá vỡ** `position: sticky` -- đây là hạn chế của CSS: sticky chỉ hoạt động khi không có phần tử cha nào giữa nó và vùng cuộn có `overflow` khác `visible`.

Dù Card bên ngoài đã có `max-h` và `overflow-auto`, div bên trong Table tạo ra một ngữ cảnh overflow riêng, khiến sticky header không hoạt động.

## Giải pháp

Thêm prop `wrapperClassName` vào component `Table` để cho phép ghi đè class của div bọc ngoài. Trong trang Users Directory, truyền class bỏ `overflow-auto` để sticky hoạt động.

### Tệp 1: `src/components/ui/table.tsx`

Mở rộng Table để nhận thêm `wrapperClassName`:

```tsx
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <div className={cn("relative w-full overflow-auto", wrapperClassName)}>
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
```

### Tệp 2: `src/pages/UsersDirectory.tsx`

Truyền `wrapperClassName` để tắt overflow trên div bọc Table:

```tsx
<Table wrapperClassName="overflow-visible">
```

Khi đó Card (`overflow-auto` + `max-h`) là vùng cuộn duy nhất, và `sticky top-0` trên TableHeader sẽ hoạt động đúng.

| Tệp | Thay đổi |
|------|----------|
| `src/components/ui/table.tsx` | Thêm prop `wrapperClassName` cho Table |
| `src/pages/UsersDirectory.tsx` | Truyền `wrapperClassName="overflow-visible"` vào Table |

