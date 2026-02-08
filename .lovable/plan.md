

# Giảm độ dày viền các nút Filter Chips trên Mobile

## Tình trạng hiện tại

Các chip hiện đang sử dụng `border-2` (2px) cho cả trạng thái được chọn và mặc định. Người dùng muốn viền mỏng hơn một chút.

## Giải pháp

Giảm độ dày viền từ `border-2` (2px) xuống `border-[1.5px]` -- một mức trung gian giữa 1px (quá mỏng) và 2px (quá dày), phù hợp cho hiển thị trên mobile.

## File cần chỉnh sửa

**File duy nhất:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

**Dòng 34 (chip selected):** Đổi `border-2` thành `border-[1.5px]`

**Dòng 35 (chip default):** Đổi `border-2` thành `border-[1.5px]`

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| Thay đổi | 2 chỗ trên dòng 34 và 35 |
| Cơ sở dữ liệu | Không |
| Đồng bộ Mobile | Tự động (component dùng chung) |

## Kết quả

- Viền mỏng hơn (1.5px thay vì 2px), trông thanh thoát hơn trên mobile
- Vẫn đủ rõ ràng để nhìn thấy viền xanh logo (#0066FF)
- Giữ nguyên tất cả màu sắc và gradient đã thiết lập

