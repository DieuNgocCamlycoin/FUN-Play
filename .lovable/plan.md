

## Nâng cấp thuật toán gợi ý video - Đa dạng kênh thực sự

### Nguyên nhân gốc rễ

Hiện tại, cả 4 bước truy vấn video trong `fetchRelatedVideos` đều sắp xếp theo `view_count DESC`. Kênh "Angel Que Anh" có tổng lượt xem gấp 3 lần kênh thứ 2, nên video của kênh này chiếm hầu hết kết quả ở mọi bước. Thuật toán `applyChannelDiversity` chỉ ngăn 2 video **liên tiếp** cùng kênh, nhưng không giới hạn **tổng số** video mỗi kênh, dẫn đến sidebar toàn video Angel Que Anh.

**Dữ liệu thực tế:**
| Kênh | Lượt xem | Số video |
|------|----------|----------|
| Angel Que Anh | 2,798 | 21 |
| ThienHanh68 | 891 | 50 |
| Vinh Nguyen | 274 | 83 |
| Tran Van Luc | 269 | 73 |
| Hoangtydo | 234 | 57 |
| THU TRANG | 189 | 48 |
| ... 10+ kênh khác | ... | ... |

### Giải pháp - Thuật toán Round-Robin + Cap mỗi kênh

Thay đổi hoàn toàn logic `fetchRelatedVideos` trong `VideoPlaybackContext.tsx`:

**1. Truy vấn 1 lần duy nhất** (thay vì 4 lần riêng lẻ):
- Lấy 80 video approved, sắp xếp theo `view_count DESC`
- Loại trừ video hiện tại

**2. Phân nhóm theo kênh:**
- Gom video theo `channel_id`
- Mỗi kênh tối đa 3 video trong kết quả cuối

**3. Round-robin đa dạng:**
- Lấy lần lượt 1 video từ mỗi kênh, vòng qua tất cả kênh
- Ưu tiên video view cao nhất của mỗi kênh trước
- Đảm bảo tối thiểu 6-8 kênh khác nhau

**4. Giữ nguyên `applyChannelDiversity`** để đảm bảo không quá 2 liên tiếp cùng kênh

### Nâng cấp `applyChannelDiversity`

Thêm giới hạn: **tối đa 3 video từ cùng 1 kênh** trong toàn bộ danh sách (không chỉ liên tiếp):

```text
// Pseudocode
MAX_PER_CHANNEL = 3
channelCounts = {}
for each video in candidates:
  if channelCounts[video.channel_id] >= MAX_PER_CHANNEL:
    skip
  if last 2 videos same channel:
    defer to later
  else:
    add to result
    channelCounts[channel_id]++
```

### Chi tiết kỹ thuật

**Tệp thay đổi:** `src/contexts/VideoPlaybackContext.tsx`

**fetchRelatedVideos mới:**
- Gộp 4 query thành 1 query duy nhất (giảm latency)
- Lấy 80 video, phân nhóm theo kênh
- Round-robin: lấy video tốt nhất từ mỗi kênh, xoay vòng đến khi đủ 30
- Cap 3 video/kênh

**applyChannelDiversity nâng cấp:**
- Thêm `channelCountMap` theo dõi tổng video mỗi kênh
- Khi kênh đạt 3 video: bỏ qua, chuyển sang kênh khác
- Giữ rule không quá 2 liên tiếp cùng kênh

**Bỏ fetchRecommendedVideos trong Watch.tsx:**
- Hàm `fetchRecommendedVideos` (dòng 302-359) hiện không được sử dụng bởi UpNextSidebar (sidebar dùng `getUpNext` từ context)
- Xóa bỏ để tránh nhầm lẫn và giảm 1 query thừa

### Kết quả mong đợi

- Sidebar hiển thị video từ ít nhất 6-8 kênh khác nhau
- Mỗi kênh tối đa 3 video (thay vì 10+ như hiện tại)
- Giảm từ 4 queries xuống 1 query duy nhất (nhanh hơn)
- Vẫn ưu tiên video chất lượng cao (view count) nhưng phân bổ đều giữa các kênh
