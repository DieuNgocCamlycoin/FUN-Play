

## Cải thiện thuật toán "Xu hướng" — Kết hợp đa tiêu chí

### Vấn đề hiện tại
Thẻ "Xu hướng" hiện chỉ sắp xếp theo **tổng lượt xem** (`view_count`), dẫn đến:
- Video cũ nhưng nhiều lượt xem luôn đứng đầu
- Video mới có tương tác tốt bị chìm xuống dưới
- Không phản ánh đúng "xu hướng" đang diễn ra

### Giải pháp: Điểm xu hướng (Trending Score)
Tính điểm cho mỗi video dựa trên **4 tiêu chí**, có trọng số khác nhau:

```text
Trending Score = (view_count x 1.0)
              + (like_count x 3.0)
              + (comment_count x 5.0)
              + Hệ số thời gian (Time Decay)
```

#### Chi tiết từng tiêu chí

| Tiêu chí | Trọng số | Lý do |
|----------|---------|-------|
| Lượt xem | x1.0 | Phổ biến nhưng dễ đạt được |
| Lượt thích | x3.0 | Thể hiện sự yêu thích thực sự |
| Bình luận | x5.0 | Thể hiện tương tác sâu nhất |
| Thời gian | Hệ số giảm dần | Video mới được ưu tiên hơn |

#### Hệ số thời gian (Time Decay)
- Video trong **24 giờ** qua: nhân thêm **x5.0**
- Video trong **3 ngày** qua: nhân thêm **x3.0**
- Video trong **7 ngày** qua: nhân thêm **x2.0**
- Video trong **14 ngày** qua: nhân thêm **x1.5**
- Video trong **30 ngày** qua: nhân thêm **x1.0**
- Video **cũ hơn 30 ngày**: nhân thêm **x0.5**

#### Ví dụ minh họa
- Video A: 1.000 lượt xem, 50 like, 10 bình luận, đăng 2 ngày trước
  - Điểm = (1000 + 150 + 50) x 3.0 = **3.600**
- Video B: 5.000 lượt xem, 100 like, 20 bình luận, đăng 20 ngày trước
  - Điểm = (5000 + 300 + 100) x 1.0 = **5.400**
- Video C: 200 lượt xem, 80 like, 30 bình luận, đăng 6 giờ trước
  - Điểm = (200 + 240 + 150) x 5.0 = **2.950**

### Thay đổi kỹ thuật

#### File: `src/pages/Index.tsx`

1. **Thêm hàm tính điểm xu hướng** `calculateTrendingScore(video)`:
   - Tính điểm tương tác: `views * 1 + likes * 3 + comments * 5`
   - Tính hệ số thời gian dựa trên `created_at`
   - Trả về: điểm tương tác x hệ số thời gian

2. **Cập nhật fetch query** (dòng 128-150):
   - Thêm `like_count` và `comment_count` vào danh sách select

3. **Cập nhật phần sort** (dòng 308-312):
   - Thay `(b.view_count || 0) - (a.view_count || 0)` bằng `calculateTrendingScore(b) - calculateTrendingScore(a)`

| Tệp | Thay đổi |
|------|---------|
| `src/pages/Index.tsx` | Thêm hàm `calculateTrendingScore`, cập nhật select query và logic sắp xếp |

### Kết quả mong đợi
- Video mới có tương tác tốt sẽ được đẩy lên cao trong "Xu hướng"
- Video cũ dù nhiều lượt xem cũng sẽ dần tụt hạng
- Bình luận và lượt thích được đánh giá cao hơn lượt xem đơn thuần
- Danh sách xu hướng phản ánh đúng nội dung đang "hot" trên nền tảng

