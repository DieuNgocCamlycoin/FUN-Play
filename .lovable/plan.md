
# Phân tích & Sửa lỗi Hệ thống Thưởng CAMLY

## 3 Lỗi nghiêm trọng phát hiện

### Loi 1: Sai lệch số dư profiles vs reward_transactions (CRITICAL)
Dữ liệu thực tế cho thấy hầu hết users có `total_camly_rewards` trong profiles **thấp hơn** tổng thực tế trong bảng `reward_transactions`. Ví dụ:

| User | profiles.total | Thực tế (reward_transactions) | Chênh lệch |
|------|---------------|-------------------------------|-------------|
| Nguyễn Thu | 1,495,000 | 2,720,000 | -1,225,000 |
| Chí Viễn | 1,625,000 | 2,735,000 | -1,110,000 |
| Thu Trang | 2,255,000 | 3,340,000 | -1,085,000 |
| Minh Quân | 2,585,000 | 3,645,000 | -1,060,000 |

**Nguyên nhân**: Edge function `award-camly` sử dụng pattern "đọc rồi ghi" (read-then-write) không atomic. Khi 2 rewards xử lý đồng thời (ví dụ user like + view cùng lúc), một giao dịch sẽ ghi đè lên giao dịch kia, gây mất dữ liệu.

### Loi 2: Bộ lọc loại thưởng không hoạt động (Filter broken)
Database lưu reward_type dạng UPPERCASE (`VIEW`, `LIKE`, `COMMENT`...) nhưng:
- `REWARD_TYPE_MAP` dùng key lowercase (`view`, `like`, `comment`)
- Filter Select dùng value lowercase (`view`, `like`...)
- So sánh `t.reward_type === "view"` sẽ **không bao giờ khớp** với `"VIEW"` trong database

### Loi 3: Tổng thống kê bị giới hạn 500 dòng
Trang Reward History tính tổng "Tổng đã kiếm", "Chờ duyệt"... từ dữ liệu fetch được (tối đa 500 dòng). Nhưng nhiều user có 600-900+ giao dịch, nên con số hiển thị sẽ **thiếu chính xác**.

---

## Kế hoạch sửa lỗi

### Buoc 1: Sửa Edge Function `award-camly` - Dùng SQL atomic update
Thay vì đọc rồi ghi:
```
// CU: read profile -> calculate new total -> update (RACE CONDITION!)
oldTotal = profile.total_camly_rewards
newTotal = oldTotal + amount
update profiles set total_camly_rewards = newTotal
```
Chuyển sang atomic increment:
```
// MOI: Dùng SQL increment trực tiếp, không bị race condition
update profiles set 
  total_camly_rewards = total_camly_rewards + amount,
  pending_rewards = pending_rewards + amount  -- hoặc approved_reward
```

### Buoc 2: Tạo RPC đồng bộ lại số dư cho tất cả users
Tạo database function `sync_reward_totals()` để:
- Tính lại `total_camly_rewards` = SUM(amount) từ reward_transactions
- Tính lại `pending_rewards` = SUM(amount) WHERE approved = false
- Tính lại `approved_reward` = SUM(amount) WHERE approved = true AND claimed = false
- Chạy cho tất cả users để sửa dữ liệu sai lệch hiện tại

### Buoc 3: Sửa trang RewardHistory
1. **Fix filter**: Chuyển REWARD_TYPE_MAP sang UPPERCASE keys, và filter Select dùng UPPERCASE values
2. **Fix tổng thống kê**: Sử dụng RPC `get_user_activity_summary` (đã có sẵn) để lấy tổng chính xác từ server thay vì tính từ 500 dòng client-side
3. Thêm các loại thưởng còn thiếu: `SHORT_VIDEO_UPLOAD`, `LONG_VIDEO_UPLOAD`, `BOUNTY`

---

## Chi tiết kỹ thuật

### Files cần sửa:
1. `supabase/functions/award-camly/index.ts` - Sửa logic update profile thành atomic increment
2. `src/pages/RewardHistory.tsx` - Fix filter uppercase, fix tổng thống kê dùng RPC
3. Tạo migration SQL để tạo RPC `sync_reward_totals` và chạy đồng bộ dữ liệu

### Ảnh hưởng:
- Sau khi sync, tất cả users sẽ thấy số thưởng chính xác
- Filter loại thưởng sẽ hoạt động đúng
- Tổng thống kê hiển thị đúng dù user có hàng nghìn giao dịch
- Không còn mất thưởng do race condition trong tương lai
