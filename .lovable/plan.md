
# Sửa lỗi các nút Filter Chips không hiển thị màu trắng

## Nguyên nhân

Các nút chưa được chọn sử dụng `variant="secondary"` của component `Button`. Variant này có sẵn gradient nền tím-hồng mạnh:

```
bg-gradient-to-r from-cosmic-magenta to-divine-rose-gold
```

Class tùy chỉnh `bg-white/90` không thể ghi đè được gradient này vì Tailwind xử lý `background-image` (gradient) ưu tiên hơn `background-color` (white). Đây là lý do các nút hiển thị tím-hồng thay vì trắng.

Tương tự, chip được chọn dùng `variant="default"` cũng có gradient riêng có thể xung đột.

## Giải pháp

Đổi cả hai trạng thái sang `variant="ghost"` -- variant này không có màu nền mặc định, cho phép các class tùy chỉnh hoạt động đúng.

## File cần chỉnh sửa

**File duy nhất:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

**Dòng 30:** Thay đổi variant cho cả hai trạng thái từ điều kiện `selected === category ? "default" : "secondary"` thành `"ghost"` cho tất cả.

```tsx
// Hiện tại (dòng 30):
variant={selected === category ? "default" : "secondary"}

// Thay thành:
variant="ghost"
```

Việc này loại bỏ hoàn toàn các gradient nền và shadow từ variant gốc, để các class tùy chỉnh (gradient Teal-Cyan-Blue cho chip được chọn, nền trắng cho chip mặc định) hoạt động đúng.

Không cần thay đổi gì khác -- các class CSS tùy chỉnh ở dòng 34-35 đã đúng rồi.

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| Thay đổi | 1 dòng (dòng 30) |
| Cơ sở dữ liệu | Không |
| Đồng bộ Mobile | Tu dong (component dung chung) |

## Ket qua

- Chip duoc chon: Gradient Teal-Cyan-Blue (giong nut WALLET) voi chu trang
- Chip mac dinh: Nen trang sach se voi chu xanh Cyan va vien Cyan nhe
- Khong con hieu ung tim-hong tu variant cu
