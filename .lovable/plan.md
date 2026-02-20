

## Nâng cấp trang Watch FUN PLAY giống YouTube Desktop

### Phân tích hiện trạng

Trang Watch hiện tại đã có cấu trúc cơ bản tốt: Video Player, Title, Channel + Subscribe, Action buttons, Description, Comments (trái), và UpNextSidebar (phải). Tuy nhiên cần chỉnh sửa để đạt chuẩn YouTube 90%:

**Vấn đề chính:**
1. Sidebar (UpNextSidebar) không sticky khi cuộn - mất khi cuộn xuống phần bình luận
2. Thông tin kênh và các nút hành động nằm trên 2 dòng riêng, chưa gộp lại 1 dòng như YouTube
3. Lượt xem và ngày đăng nằm riêng ngoài, chưa nằm trong Description box
4. Sidebar không có filter chips (Tất cả / Cùng kênh / Liên quan)
5. Một số nút có gradient sặc sỡ, chưa sạch như YouTube
6. Sidebar có quá nhiều phần phụ (Đang phát, Header controls) chiếm diện tích

### Kế hoạch thay đổi

#### 1. Watch.tsx - Chỉnh layout Desktop

**Thay đổi cụ thể:**

- Thêm `lg:items-start` vào grid để sidebar sticky hoạt động đúng
- **Xóa dòng hiển thị lượt xem + ngày đăng riêng** (dòng 740-745) - chuyển vào trong Description box
- **Gộp Channel + Actions vào 1 dòng**: Avatar + tên kênh + nút Đăng ký (bên trái), Like/Dislike + Chia sẻ + Lưu + Tặng + menu "..." (bên phải)
- **Nút ReportSpam**: Chuyển vào trong menu "..." thay vì hiển thị riêng
- **Nút Chia sẻ, Lưu**: Bỏ border, dùng `bg-muted hover:bg-muted/80` sạch hơn
- **Nút Đăng ký khi chưa đăng ký**: Giữ màu cosmic-cyan đặc trưng FUN PLAY (không đổi sang đen như YouTube)
- **Nút Tặng (Gift)**: Giữ nguyên hiệu ứng gold đặc trưng nhưng nhẹ hơn

#### 2. UpNextSidebar.tsx - Sticky + Filter Chips + Gọn gàng

**Thay đổi cụ thể:**

- Bọc toàn bộ sidebar trong `div` có `sticky top-[72px]` để dính khi cuộn
- **Thêm filter chips** phía trên danh sách video:
  - `[Tất cả]` - mặc định, hiển thị toàn bộ video đề xuất
  - `[Cùng kênh]` - lọc video cùng channel_id với video đang xem
  - `[Liên quan]` - lọc video cùng category
- **Gọn hóa header**: Gộp Autoplay toggle + Shuffle/Repeat vào 1 dòng nhỏ gọn, bỏ card viền
- **Bỏ khung "Đang phát"** (currently playing card) vì YouTube không có
- **Bỏ số thứ tự** (index number) ở mỗi video, giống YouTube
- **Tăng kích thước thumbnail**: Từ `w-28` lên `w-40` với `aspect-video`
- **Hiển thị mỗi video**: Thumbnail + Title (tối đa 2 dòng) + Tên kênh + Lượt xem + Thời gian

#### 3. Logic đề xuất video đa dạng kênh

Giữ nguyên logic round-robin hiện tại đã đảm bảo đa dạng kênh (tối thiểu 5 kênh khác nhau, không quá 2 video liên tiếp cùng kênh). Logic này đã được triển khai tốt trong `fetchRecommendedVideos`.

### Chi tiết kỹ thuật

| STT | Tệp | Nội dung thay đổi |
|-----|------|-------------------|
| 1 | `src/pages/Watch.tsx` | Gộp Channel + Actions 1 dòng, chuyển lượt xem vào Description box, chuyển ReportSpam vào menu "...", bỏ border các nút phụ, thêm `items-start` cho grid |
| 2 | `src/components/Video/UpNextSidebar.tsx` | Thêm `sticky top-[72px]`, thêm filter chips (Tất cả/Cùng kênh/Liên quan), gọn hóa header, bỏ card "Đang phát", bỏ số thứ tự, tăng kích thước thumbnail |

### Giữ lại nét đặc trưng FUN PLAY

- Nút "Tặng" (Gift) giữ nguyên với icon vàng gold
- Nút "Đăng ký" giữ màu cosmic-cyan khi chưa đăng ký
- Like/Dislike giữ hiệu ứng màu cosmic-cyan/magenta khi active
- Ambient glow effect phía sau player giữ nguyên
- Mini profile card hover giữ nguyên

### Kết quả mong đợi

- Layout giống YouTube trên 90%: Player → Title → Channel + Actions (1 dòng) → Description (gray card) → Comments | Sidebar sticky
- Sidebar dính khi cuộn, có filter chips để lọc nhanh
- Các nút hành động sạch sẽ, hiện đại, không gradient sặc sỡ
- Typography và spacing chuẩn YouTube
- Vẫn giữ nét thương hiệu FUN PLAY: nút Tặng, màu cosmic, ambient glow

