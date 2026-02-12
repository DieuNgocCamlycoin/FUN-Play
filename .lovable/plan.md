
# Xóa bước duyệt Admin - Tự động duyệt tất cả thưởng CAMLY

## Tổng quan
Chuyển hệ thống thưởng CAMLY từ mô hình "chờ Admin duyệt" sang "tự động duyệt ngay lập tức". Tất cả phần thưởng sẽ được chuyển thẳng vào số dư có thể claim, người dùng chỉ cần kết nối ví và đủ ngưỡng 200,000 CAMLY là claim được.

## Thay đổi

### 1. Edge Function `award-camly` - Luôn auto-approve
**File: `supabase/functions/award-camly/index.ts`**
- Bỏ logic kiểm tra `suspicious_score` để quyết định auto-approve
- Luôn gọi `atomic_increment_reward` với `p_auto_approve = true`
- Luôn set `approved = true` và `approved_at` khi tạo `reward_transaction`
- Giữ nguyên tất cả anti-fraud checks khác (daily limits, spam, duplicate)

### 2. Trang Lịch sử thưởng (`RewardHistory.tsx`)
- Xóa thẻ thống kê "Chờ duyệt" (thay bằng thẻ "Có thể Claim")
- Xóa option lọc "Chờ duyệt" trong filter trạng thái
- Thay đổi badge trạng thái: chỉ còn "Có thể claim" và "Đã claim" (không còn "Chờ duyệt")
- Cập nhật tính toán tổng: bỏ `totalPending`, gộp vào `totalApproved`

### 3. Claim Rewards Modal (`ClaimRewardsModal.tsx`)
- Xóa toàn bộ phần "Phần thưởng đang chờ duyệt" (pending breakdown)
- Xóa cột "Chờ duyệt" trong tổng quan
- Đơn giản hóa UI: chỉ hiển thị tổng có thể claim và nút Claim

### 4. Claim Rewards Section trên Wallet (`ClaimRewardsSection.tsx`)
- Xóa thẻ "Đang chờ duyệt"
- Xóa ghi chú "Thưởng cần được Admin duyệt"
- Giữ 3 thẻ: Tổng đã nhận, Có thể Claim, Đã Claim

### 5. Pending Rewards Widget (`PendingRewardsWidget.tsx`)
- Đổi tiêu đề "Phần thưởng chờ claim" thành "Phần thưởng sẵn sàng"
- Dùng `approved_reward` thay cho `pending_rewards` làm nguồn dữ liệu chính

### 6. Hook `useClaimHistory.ts`
- Cập nhật `usePendingRewards` để lấy `approved_reward` thay `pending_rewards`

## File cần sửa
1. `supabase/functions/award-camly/index.ts` - Luôn auto-approve
2. `src/pages/RewardHistory.tsx` - Xóa UI chờ duyệt
3. `src/components/Rewards/ClaimRewardsModal.tsx` - Đơn giản hóa
4. `src/components/Wallet/ClaimRewardsSection.tsx` - Xóa thẻ chờ duyệt
5. `src/components/Dashboard/PendingRewardsWidget.tsx` - Cập nhật nguồn dữ liệu
6. `src/hooks/useClaimHistory.ts` - Cập nhật hook

## Lưu ý
- Anti-fraud checks (daily limits, spam detection, duplicate prevention) vẫn giữ nguyên
- Admin vẫn có thể xem tất cả reward transactions trong Admin Dashboard
- Ngưỡng claim tối thiểu 200,000 CAMLY vẫn giữ nguyên
