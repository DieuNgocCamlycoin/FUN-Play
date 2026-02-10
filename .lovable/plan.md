

# Điều chỉnh Celebration Card — Bỏ khung tối, đổi "Biên nhận" thành "Celebration Card", hiển thị đầy đủ thông tin trên Chat

---

## 3 thay đổi chính

### 1. Xoá khung nền tối trên DonationCelebrationCard (Profile)

**File: `src/components/Profile/DonationCelebrationCard.tsx`** (dòng 232)

Xoá `bg-black/30 rounded-xl p-3 backdrop-blur-sm` ở div chứa phần chi tiết giao dịch (Trạng thái, Chủ đề, Lời nhắn...). Chỉ giữ `space-y-1.5 text-sm` — nội dung vẫn đọc rõ nhờ overlay `bg-black/45` đã có sẵn trên toàn card.

### 2. Đổi tất cả nút "Xem biên nhận" thành "Xem Celebration Card"

Thay đổi ở 3 file:
- **`DonationCelebrationCard.tsx`** (dòng 282): icon `ExternalLink` -> `Gift`, text "Xem biên nhận" -> "Xem Celebration Card"
- **`ChatDonationCard.tsx`** (dòng 213): text "Xem biên nhận" -> "Xem Celebration Card"
- **`PreviewCelebration.tsx`** (dòng 121): text "Xem biên nhận" -> "Xem Celebration Card"

### 3. Chat Card hiển thị đầy đủ thông tin như Profile Card

**File: `src/components/Chat/ChatDonationCard.tsx`**

Hiện tại chat card chỉ hiển thị: tiêu đề, avatar + số tiền, tên người gửi/nhận, footer. Thiếu: username, địa chỉ ví, trạng thái, chủ đề, lời nhắn, thời gian, chain, TX hash, mã biên nhận.

Thay đổi:
- Fetch thêm: `message`, `tx_hash`, `chain`, `created_at`, `explorer_url` + `wallet_address`, `username` từ profiles
- Render đầy đủ layout giống `DonationCelebrationCard`: avatar đôi bên kèm username + ví rút gọn, phần chi tiết giao dịch (không có khung tối), nút "Xem Celebration Card"
- Tăng `max-w-[280px]` lên `max-w-[320px]` để đủ không gian hiển thị
- Tăng avatar lên `h-12 w-12`, font size lên `text-sm`

**Cập nhật tương ứng trong `PreviewCelebration.tsx`**: MockChatDonationCard cũng hiển thị đầy đủ thông tin giống layout mới.

---

## Tóm tắt

| # | File | Thay đổi |
|---|------|----------|
| 1 | `DonationCelebrationCard.tsx` | Xoá `bg-black/30 rounded-xl p-3 backdrop-blur-sm`; đổi nút thành "Xem Celebration Card" |
| 2 | `ChatDonationCard.tsx` | Hiển thị đầy đủ thông tin (username, ví, trạng thái, chủ đề, lời nhắn, thời gian, chain, TX hash, mã biên nhận); đổi nút; tăng kích thước |
| 3 | `PreviewCelebration.tsx` | Cập nhật MockChatDonationCard đầy đủ thông tin + xoá khung tối MockDonationCelebrationCard + đổi nút |

