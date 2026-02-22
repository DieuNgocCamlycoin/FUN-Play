

## Sửa 2 lỗi Tooltip trên Orbit

### Lỗi 1: Tooltip cũ không ẩn khi rê sang icon khác (chồng chéo + chớp tắt)

Hiện tại mỗi `<Tooltip>` là uncontrolled (không có state quản lý). Khi hover sang icon khác, tooltip cũ không tự đóng.

**Giải pháp**: Thêm state `activeTooltip` (lưu key của platform đang hover). Mỗi `<Tooltip>` sẽ controlled bằng `open={activeTooltip === platform.key}` và `onOpenChange` sẽ set/clear state này. Chỉ 1 tooltip hiển thị tại 1 thời điểm.

### Lỗi 2: Tooltip xoay tròn quanh trục chính mình

Nguyên nhân: Class `animate-[orbit-tooltip-counter-spin_25s_linear_infinite]` đang áp dụng cho `TooltipContent`. Radix tooltip render qua **portal** (nằm ngoài DOM của orbit), nên nó không bị xoay theo orbit. Việc thêm counter-spin lại khiến nó tự xoay vòng.

**Giải pháp**: Xóa class `animate-[orbit-tooltip-counter-spin_25s_linear_infinite]` khỏi `TooltipContent`. Tooltip sẽ tự động nằm ngang vì nó render ngoài container xoay.

### Chi tiết kỹ thuật

| File | Dòng | Thay đổi |
|---|---|---|
| `SocialMediaOrbit.tsx` | ~230 | Thêm `const [activeTooltip, setActiveTooltip] = useState<string \| null>(null)` |
| `SocialMediaOrbit.tsx` | 253 | `<Tooltip>` -> `<Tooltip open={activeTooltip === platform.key} onOpenChange={(open) => setActiveTooltip(open ? platform.key : null)}>` |
| `SocialMediaOrbit.tsx` | 255-273 | Thêm `onMouseEnter={() => setActiveTooltip(platform.key)}` và `onMouseLeave={() => setActiveTooltip(null)}` cho thẻ `<a>` |
| `SocialMediaOrbit.tsx` | 275 | Xóa `animate-[orbit-tooltip-counter-spin_25s_linear_infinite]` khỏi className của `TooltipContent` |

