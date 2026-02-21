

## Cập nhật kênh bị đình chỉ: Bỏ hiệu ứng trắng đen

### Yêu cầu 1: Giữ màu channel bình thường

**File:** `src/components/Profile/ProfileHeader.tsx`

Xóa các class `grayscale` và `opacity-70` khi user bị ban, nhưng vẫn giữ:
- Banner "Kênh này đã bị đình chỉ" (SuspendedBanner)
- Ẩn glow ring khi bị ban
- Ẩn các nút hành động (Theo dõi, Chia sẻ, v.v.)

Cụ thể:
- **Dòng 40**: Bỏ `grayscale opacity-70` khỏi cover photo container
- **Dòng 71-81**: Bỏ điều kiện thay rainbow border bằng viền xám -- giữ rainbow border bình thường cho tất cả
- **Dòng 84**: Bỏ `grayscale` khỏi avatar container

Glow ring (dòng 65-68) vẫn có thể giữ hoặc bỏ tùy ý -- theo yêu cầu "giữ bình thường" thì sẽ hiện lại glow ring.

### Yêu cầu 2: Về video/short trống

Đây không phải lỗi code. Video và Short của kênh đã bị admin sử dụng công cụ "Cleanup" (xóa video user bị ban) để giải phóng dung lượng. Khi admin chạy cleanup, toàn bộ video/thumbnail bị xóa khỏi storage và database, nên kênh hiển thị "Chưa có Video".

Thưởng (677K CAMLY) vẫn còn vì theo chính sách "Bảo toàn tài chính" -- dữ liệu thưởng được giữ nguyên để đảm bảo tính chính xác của tổng lượng tiền lưu thông.

**Không cần sửa code cho phần này.**

### Chi tiết kỹ thuật

| Vị trí | Hiện tại | Sau khi sửa |
|---|---|---|
| Cover photo (dòng 40) | `grayscale opacity-70` khi banned | Không thêm class nào |
| Rainbow border (dòng 71-81) | Thay bằng viền xám khi banned | Giữ rainbow border bình thường |
| Avatar (dòng 84) | `grayscale` khi banned | Không thêm class nào |
| Glow ring (dòng 65-68) | Ẩn khi banned | Hiện bình thường |

