

## Sửa triệt để thuật toán video gợi ý - Diversity-First

### Vấn đề gốc rễ (3 lỗi chính)

1. **Session chỉ tạo 1 lần**: Dòng 307 trong Watch.tsx kiểm tra `!session` - nghĩa là khi đã có session (cache từ localStorage), KHÔNG BAO GIỜ tạo lại. Danh sách gợi ý cũ sẽ hiển thị mãi.

2. **Chỉ lấy top 80 video theo view**: Kênh Angel Que Anh (2,798 views) chiếm phần lớn top 80. Nhiều kênh nhỏ không bao giờ xuất hiện trong pool ứng viên.

3. **MAX_PER_CHANNEL = 3 vẫn quá nhiều**: Với 20 video hiển thị, 3 video/kênh nghĩa là 1 kênh chiếm 15%. Cần giảm xuống 2.

### Giải pháp - Xây dựng lại hoàn toàn

#### 1. Watch.tsx - Luôn tạo session mới khi đổi video

Thay `if (video && id && !session)` bằng `if (video && id)` kèm kiểm tra `session.start_video_id !== id` - bắt buộc tạo lại session khi xem video khác.

#### 2. VideoPlaybackContext.tsx - Thuật toán mới hoàn toàn

**a. Thay fetchRelatedVideos bằng getUpNextRecommendations:**

- Lấy 200 video ứng viên (thay vì 80), sắp xếp ngẫu nhiên + view_count
- Phân nhóm theo channel_id
- MAX_PER_CHANNEL = 2 (giảm từ 3)
- Round-robin nghiêm ngặt: vòng 1 lấy 1 video/kênh, vòng 2 mới cho phép video thứ 2
- Trong top 10: mỗi kênh tối đa 1 video
- Đảm bảo tối thiểu 8 kênh unique (nếu DB đủ data)

**b. Chống lặp theo phiên:**

- Lưu 100 video ID đã gợi ý gần nhất trong sessionStorage
- Loại trừ các video đã gợi ý khi tính lại danh sách

**c. Debug logging:**

- Log số kênh unique, số video/kênh, cảnh báo nếu < 8 kênh

### Chi tiet ky thuat

**File 1: `src/contexts/VideoPlaybackContext.tsx`**

Thay doi:
- `MAX_PER_CHANNEL`: 3 thanh 2
- `fetchRelatedVideos`: Xay lai hoan toan
  - Query 200 video approved (khong chi top view, pha tron random)
  - Group theo channel
  - Round-robin: vong 1 lay dung 1 video/kenh, vong 2 moi cho them
  - Top 10 video: max 1/kenh
  - Kiem tra unique channels >= 8, neu khong du thi mo rong pool
  - Loai tru session seen IDs
- `applyChannelDiversity`: Cap = 2 thay vi 3
- Them `SESSION_SEEN_KEY` trong sessionStorage de theo doi video da goi y

Logic moi (pseudocode):

```text
1. seenIds = load from sessionStorage (max 100)
2. Query 200 videos, exclude currentVideo + seenIds
3. Group by channel_id
4. Shuffle channel order (to avoid always same priority)
5. Round 1: pick best video from each channel (max 1/channel)
   -> This gives us 1 video per channel = diversity guaranteed
6. Round 2: pick 2nd best from each channel (if needed, cap = 2)
7. Apply consecutive rule (no 2+ in a row same channel)
8. Take top 20
9. Save these 20 IDs to sessionStorage seen list
10. Console.log: unique channels count, per-channel counts
```

**File 2: `src/pages/Watch.tsx`**

Thay doi:
- Line 306-310: Bo `!session` check, thay bang logic tao lai session moi khi video ID thay doi
- Them `clearSession()` truoc khi `createSession()` de dam bao fresh data

### Ket qua mong doi

- Mo 10 video khac nhau: moi video co danh sach goi y KHAC NHAU
- Trong 20 video goi y: khong kenh nao qua 2 video
- Toi thieu 8 kenh unique trong danh sach
- Console log hien thi so lieu da dang kenh de kiem chung
- Khong con tinh trang lap lai 1-2 kenh

