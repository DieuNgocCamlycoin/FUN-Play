

## Fix: Ghim CategoryChips cố định ở đầu trang

### Nguyên nhân
Div gốc của trang (`line 324`) có class `overflow-x-hidden`. Trong CSS, khi set `overflow-x: hidden`, trình duyệt tự động tạo scroll container mới, khiến `sticky` không hoạt động đúng.

### Giải pháp
Đổi CategoryChips từ `sticky` sang `fixed` positioning trên cả mobile và desktop, đảm bảo nó luôn cố định ở đầu khu vực nội dung.

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Layout/CategoryChips.tsx` | Đổi từ `sticky top-0 lg:top-14` sang `fixed` positioning với `top` và `left/right` phù hợp |
| `src/pages/Index.tsx` | Thêm padding-top cho nội dung bên dưới CategoryChips để bù phần bị che (~44px). Truyền thêm prop `sidebarExpanded` vào CategoryChips để căn chỉnh `left` trên desktop |

### Chi tiết kỹ thuật

1. **CategoryChips.tsx**: Đổi class thành `fixed`, set `top` phù hợp (mobile: `top-[3.5rem]` sau header, desktop: `lg:top-14`), set `left`/`right` để khớp với sidebar và right panel. Nhận prop `sidebarExpanded` để tính `left` đúng (60 hoặc 16 = `lg:left-60` hoặc `lg:left-16`). `right` trên desktop = `lg:right-[260px]` khớp với right sidebar.

2. **Index.tsx**: Thêm `mt-[44px]` (hoặc tương đương) vào div nội dung ngay dưới CategoryChips để tránh bị che. Truyền prop `sidebarExpanded={isSidebarExpanded}` vào CategoryChips.

