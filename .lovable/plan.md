

# Triển khai 3 Fix: Wallet Mismatch + Dedup Check + Notification nhắc nhở

## Tổng quan
Triển khai đồng thời 3 cải thiện cho quy trình mint FUN Money đã phát hiện ở bước rà soát.

---

## 1. Wallet Mismatch Warning — AdminMintPanel

**File sửa:** `src/components/Multisig/AdminMintPanel.tsx`, `src/hooks/useMintSubmit.ts`

- Trong `useMintSubmit`, khi load `pplp_mint_requests`, join thêm `profiles.wallet_address` qua `user_id`
- Nếu không join được (RLS), query riêng profiles cho các user_id trong danh sách requests
- Trong `AdminMintPanel`, so sánh `req.recipient_address` với wallet hiện tại của user
- Nếu khác nhau → hiển thị Badge cảnh báo `⚠️ Ví đã đổi` màu vàng/cam, kèm tooltip cho thấy ví cũ vs ví mới
- Disable nút "Mint TX" khi có mismatch, yêu cầu admin xác nhận thủ công (thêm nút "Xác nhận mint dù ví khác")

## 2. Dedup Check — useFunMoneyMintRequest

**File sửa:** `src/hooks/useFunMoneyMintRequest.ts`

- Trong `submitAutoRequest`, trước khi insert, query `mint_requests` để kiểm tra:
  ```sql
  SELECT id FROM mint_requests 
  WHERE user_id = ? AND action_type = 'LIGHT_ACTIVITY' 
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND status NOT IN ('rejected', 'failed')
  ```
- Nếu tìm thấy → throw error `"Bạn đã có yêu cầu mint LIGHT_ACTIVITY trong 24h qua. Vui lòng chờ."`
- Áp dụng tương tự cho `submitRequest` (manual PPLP flow) với cùng action_type

## 3. System Notification cho user chưa mint

**File mới:** `supabase/functions/notify-idle-pplp-users/index.ts`

- Edge function query profiles có `pplp_accepted_at IS NOT NULL` nhưng không có record trong `mint_requests` hoặc `pplp_mint_requests`
- Insert notification vào bảng `notifications` cho mỗi user:
  - type: `system`
  - title: `🌟 Bạn đã sẵn sàng mint FUN!`  
  - message: `Bạn đã ký Hiến chương PPLP nhưng chưa tạo yêu cầu mint. Hãy vào trang FUN Money để nhận FUN đầu tiên!`
  - link: `/fun-money`
- Chỉ gửi 1 lần (check nếu đã có notification cùng type + action_type = `idle_pplp_reminder` cho user đó)
- Có thể gọi thủ công từ Admin hoặc đặt cron

**File sửa thêm:** Thêm nút "Gửi nhắc nhở" trong Admin dashboard để trigger edge function

## Kết quả
- Admin được cảnh báo wallet mismatch trước khi mint sai địa chỉ
- User không thể spam nhiều request LIGHT_ACTIVITY trong 24h
- 27 user idle nhận notification nhắc nhở mint FUN

