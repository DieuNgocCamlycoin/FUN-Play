

# Điều chỉnh Flow "Tặng & Thưởng" — Dừng Auto-Post, Thêm "Lưu & Gửi"

---

## Vấn đề hiện tại

1. **Auto-post + Auto-message chạy ngay khi modal mở** (dòng 154-162 trong `GiftCelebrationModal.tsx`) — người gửi chưa kịp tuỳ chỉnh Celebration Card
2. Không có nút **"Lưu & Gửi"** tổng hợp — các hành động đăng/gửi rải rác và chạy tự động
3. Chưa có logic **thông báo người nhận** để họ chọn chia sẻ Celebration Card lên trang cá nhân
4. Chưa có tuỳ chọn **"Tải ảnh lên"** cho background tuỳ chỉnh

---

## Chi tiết thay đổi

### File 1: `src/components/Donate/GiftCelebrationModal.tsx` — Viết lại toàn diện

**A. Xoá auto-post + auto-message khi mount:**
- Xoá 2 `useEffect` tự động gọi `handleShareToProfile()` và `handleSendMessage()` (dòng 154-162)
- Các hành động này CHỈ chạy khi người dùng bấm **"Lưu & Gửi"**

**B. Thêm nút "Lưu & Gửi" (nút chính, nổi bật nhất):**
- Khi bấm, tuần tự thực hiện:
  1. Lưu metadata celebration card vào `donation_transactions.metadata` (theme, background, music)
  2. Đăng bài lên Profile (gọi `handleShareToProfile`)
  3. Gửi tin nhắn cho người nhận (gọi `handleSendMessage`)
  4. Gửi thông báo cho người nhận với lựa chọn "Chia sẻ / Không" (chèn vào bảng `notifications`)
  5. Hiển thị toast thành công + đóng modal

**C. Thêm tuỳ chọn "Tải ảnh lên" cho background:**
- Thêm 1 ô upload bên cạnh 3 thumbnail background hệ thống
- Sử dụng `<input type="file" accept="image/*">` hoặc react-dropzone (đã có trong dự án)
- Ảnh tải lên sẽ lưu vào Lovable Cloud Storage bucket và dùng URL làm background

**D. Cập nhật layout nút hành động:**
- Nút **"Lưu & Gửi"** — nổi bật, gradient vàng-cam, chiếm toàn bộ chiều rộng
- Các nút phụ (Lưu hình ảnh, Chia sẻ link, Copy TX Hash, Đóng) — nhỏ gọn bên dưới

**E. Sửa nhạc: chỉ 2 bản "Rich" mặc định (theo yêu cầu):**
- Giữ lại 2 bản: "Rich! Rich! Rich!" và "Rich Vibe"
- Xoá "Rich Energy" (hoặc giữ cả 3 tuỳ ý — yêu cầu ghi "2 file Rich mặc định")

---

### File 2: `src/components/Donate/EnhancedDonateModal.tsx` — Điều chỉnh nhỏ

- Xác nhận rằng Bước 1 (nhập liệu) **KHÔNG** có chọn chủ đề/nhạc — hiện tại đã đúng
- Xoá callback `onSuccess` khỏi `handleDonate` (hiện gọi ngay khi giao dịch thành công, trước khi user tuỳ chỉnh card)
- Chuyển `onSuccess` sang gọi từ `GiftCelebrationModal` sau khi "Lưu & Gửi"

---

### File 3: Tạo migration — Bảng `notifications` (nếu chưa có) hoặc thêm cột

- Kiểm tra bảng `notifications` hiện có trong database
- Nếu chưa có: tạo bảng với các cột: `id`, `user_id`, `type` ("gift_received"), `title`, `body`, `data` (JSONB chứa transaction_id, sender_id, v.v.), `action_type` ("share_celebration"), `action_status` ("pending"/"accepted"/"declined"), `read`, `created_at`
- Nếu đã có: thêm cột `action_type` và `action_status` nếu thiếu

---

### File 4: `src/components/Donate/DonationSuccessOverlay.tsx` — Giữ nguyên hoặc loại bỏ

- File này hiện không được import ở đâu (đã thay bằng `GiftCelebrationModal`)
- Giữ nguyên để tương thích ngược, không ảnh hưởng flow

---

### File 5: `src/hooks/useTransactionHistory.ts` — Không thay đổi

- Logic deduplicate theo `tx_hash` đã hoạt động đúng từ lần sửa trước

---

### File 6: `src/components/Transactions/TransactionCard.tsx` — Giữ nguyên

- Nút "Xem Card" đã hoạt động đúng với `receipt_public_id`

---

## Bảng tổng hợp thay đổi

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/components/Donate/GiftCelebrationModal.tsx` | Xoá auto-post/auto-message; thêm nút "Lưu & Gửi" tổng hợp; thêm upload ảnh; gửi notification cho người nhận |
| 2 | `src/components/Donate/EnhancedDonateModal.tsx` | Chuyển `onSuccess` sang sau "Lưu & Gửi" |
| 3 | Migration SQL | Kiểm tra/cập nhật bảng `notifications` hỗ trợ `action_type` + `action_status` |

---

## Flow hoàn chỉnh sau sửa

```text
Bước 1: Điền thông tin (người nhận, token, số tiền, lời nhắn)
   ↓
Bước 2: Xem xác nhận → Ký MetaMask → Chờ giao dịch
   ↓
Bước 3: Modal Celebration Card mở ra
   - Pháo hoa + Coin bay + Nhạc phát tự động
   - User tuỳ chỉnh: Chủ đề → Ảnh nền (3 có sẵn + upload) → Nhạc
   - Xem preview đầy đủ
   ↓
Bước 4: Bấm "Lưu & Gửi"
   - Đăng bài lên Profile (kèm Celebration Card)
   - Gửi tin nhắn cho người nhận
   - Gửi thông báo: "Bạn nhận được quà! Chia sẻ lên trang cá nhân?"
   ↓
Người nhận nhận thông báo:
   - Bấm "Chia sẻ" → Card hiện trên profile người nhận
   - Bấm "Không" → Chỉ giữ trong tin nhắn + lịch sử
```

---

## Ràng buộc tuân thủ

- Không thay đổi logic giao dịch on-chain (MetaMask)
- Không tạo duplicate giao dịch trong lịch sử
- Toàn bộ văn bản tiếng Việt có dấu, đúng chính tả
- Celebration Card gọn gàng, vừa khung trên cả laptop và mobile

