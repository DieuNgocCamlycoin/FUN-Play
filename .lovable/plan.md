

# Giới hạn tối đa 3 video mỗi channel trong mục "Xu hướng"

## Vấn đề
Hiện tại, mục "Xu hướng" sắp xếp video theo trending score nhưng không giới hạn số video của mỗi channel. Một channel có nhiều video hot có thể chiếm hết danh sách.

## Giải pháp
Thêm logic lọc sau khi sort: duyệt qua danh sách đã sắp xếp theo trending score, đếm số video mỗi channel, chỉ giữ tối đa 3 video/channel.

## Chi tiết thay đổi

**File**: `src/pages/Index.tsx` (dòng 309-340)

Sau bước `.sort()`, khi `selectedCategory === "Xu hướng"`, áp dụng thêm bước lọc giới hạn channel:

```text
Logic hiện tại:
  filter (5 ngày) -> sort (trending score) -> hiển thị

Logic mới:
  filter (5 ngày) -> sort (trending score) -> giới hạn 3 video/channel -> hiển thị
```

Cụ thể: Sau khi sort xong, nếu đang ở tab "Xu hướng", duyệt qua mảng kết quả, dùng một Map đếm số video theo `channels.id`. Nếu channel đã có 3 video thì bỏ qua video đó. Giữ nguyên thứ tự trending score.

- Logic tính trending score giữ nguyên 100%
- Các category khác không bị ảnh hưởng
