

# Cải thiện hệ thống thưởng CAMLY - Realtime + Phân tích

## Phân tích hiện trạng

### Dữ liệu thực tế từ database:

| Loại thưởng | Số giao dịch | Tổng CAMLY | Ghi chú |
|-------------|-------------|------------|---------|
| LIKE | 16,299 | 81,456,000 | Hoạt động tốt |
| COMMENT | 3,479 | 17,395,000 | Hoạt động tốt |
| FIRST_UPLOAD | 32 | 16,000,000 | Hoạt động tốt |
| SIGNUP | 220 | 11,000,000 | Hoạt động tốt |
| UPLOAD (legacy) | 43 | 4,300,000 | Không còn dùng |
| VIEW | 454 | 4,198,000 | Hoạt động tốt |
| LONG_VIDEO_UPLOAD | 55 | 3,850,000 | Hoạt động tốt |
| SHORT_VIDEO_UPLOAD | 98 | 1,960,000 | Hoạt động tốt |
| WALLET_CONNECT | 20 | 1,000,000 | Hoạt động tốt |
| SHARE | 17 | 82,000 | Da sua o ban truoc |
| BOUNTY | 1 | 10,000 | OK |

### Vấn đề phát hiện:
1. **42 users có video nhưng KHÔNG có upload reward** - do upload trước khi hệ thống thưởng được tích hợp, hoặc do lỗi đã sửa ở bản trước
2. **0/639 video có upload_rewarded = true** - đã sửa ở bản trước, từ giờ sẽ cập nhật đúng
3. **Share reward thấp (17)** - đã sửa ShareModal ở bản trước
4. **Trang RewardHistory chưa có Realtime** - cần thêm

### Những gì ĐÃ SỬA (bản trước):
- ShareModal: lấy userId từ auth session
- UploadContext: không thưởng gấp đôi
- Upload.tsx: cập nhật upload_rewarded = true
- Duration NULL mặc định SHORT_VIDEO

## Kế hoạch cải thiện

### A. Thêm Realtime cho trang Lịch sử thưởng
**File: `src/pages/RewardHistory.tsx`**
- Lắng nghe sự kiện `postgres_changes` trên bảng `reward_transactions` (đã có trong realtime publication)
- Khi có reward mới, tự động thêm vào danh sách và cập nhật tổng số
- Lắng nghe event `camly-reward` từ window để cập nhật ngay lập tức khi user thực hiện hành động
- Debounce 500ms để tránh re-render quá nhiều

### B. Lưu ý về phần thưởng quá khứ
Hệ thống thưởng đã được sửa và từ giờ sẽ hoạt động đúng cho tất cả hành động mới (upload, share, like, comment, view). Việc backfill tự động cho hành động cũ sẽ **KHÔNG** được thực hiện vì:
- Không thể xác minh tính hợp lệ (watch time, comment quality, etc.)
- Rủi ro thưởng trùng cho users đã nhận thưởng
- Admin nên duyệt thủ công qua trang Admin nếu cần

### Chi tiết kỹ thuật

**File: `src/pages/RewardHistory.tsx`**
- Thêm `useEffect` với Supabase Realtime channel lắng nghe `reward_transactions` INSERT cho user hiện tại
- Khi nhận event, gọi lại `fetchTransactions()` với debounce 500ms
- Thêm listener cho `window` event `camly-reward` để cập nhật tức thì
- Hiển thị badge "Live" khi đang lắng nghe realtime

## Tóm tắt

| Thay đổi | Mục đích |
|----------|---------|
| Realtime trên RewardHistory | Cập nhật thưởng theo thời gian thực |
| Debounce 500ms | Tối ưu hiệu năng |
| Badge "Live" | UX cho user biết đang realtime |

## File cần sửa
1. `src/pages/RewardHistory.tsx` - Thêm Realtime subscription

