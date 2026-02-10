

# Kế hoạch sửa Celebration Card — Tỉ lệ 4:5 + Hiển thị đúng trên Tin nhắn & Profile

---

## Vấn đề hiện tại

### 1. Celebration Card không hiển thị đúng trên Profile
- File `PostCard.tsx` (dòng 190-192) render `DonationCelebrationCard` — nhưng component này chỉ hiển thị dạng **text đơn giản** (avatar, tên, số tiền, nút "Xem biên nhận"), **không có ảnh nền, không có tỉ lệ 4:5**
- `DonationCelebrationCard` đọc theme từ `metadata.theme` nhưng `GiftCelebrationModal` lưu vào `metadata.celebration.theme` → sai đường dẫn dữ liệu

### 2. Celebration Card không hiển thị đúng trên Tin nhắn (Messenger)
- File `ChatDonationCard.tsx` chỉ hiển thị **text content + nút "Xem biên nhận"**, hoàn toàn **không render Celebration Card** với ảnh nền/theme

### 3. Celebration Card thiếu tỉ lệ 4:5
- `GiftCelebrationModal.tsx` không cố định tỉ lệ khung hình — card tự co giãn theo nội dung

### 4. Metadata lưu sai cấu trúc
- `GiftCelebrationModal` lưu: `metadata.celebration.theme`, `metadata.celebration.background`
- `DonationCelebrationCard` đọc: `metadata.theme` → không khớp, luôn fallback về "celebration"

---

## Chi tiết thay đổi

### File 1: `src/components/Profile/DonationCelebrationCard.tsx` — Viết lại

**Thay đổi chính:**
- Thêm hiển thị **ảnh nền** từ `metadata.celebration.background` (hoặc `metadata.background`)
- Cố định **tỉ lệ 4:5** bằng `aspect-[4/5]`
- Sửa đường dẫn metadata: đọc từ `metadata?.celebration?.theme` thay vì `metadata?.theme`
- Thêm đầy đủ thông tin: avatar đôi bên, số tiền, token, chủ đề, lời nhắn, thời gian, chain, TX hash, mã biên nhận
- Layout giống hình 4, 5 người dùng đã gửi (text trắng trên ảnh nền + overlay tối)

**Dữ liệu cần fetch thêm từ `donation_transactions`:**
- `tx_hash`, `chain`, `created_at`, `status`
- `metadata.celebration.background` để làm ảnh nền

### File 2: `src/components/Chat/ChatDonationCard.tsx` — Viết lại

**Thay đổi chính:**
- Thay vì chỉ hiển thị text, fetch dữ liệu từ `donation_transactions` bằng `donation_transaction_id`
- Render **mini Celebration Card** với ảnh nền, avatar, số tiền, tỉ lệ 4:5
- Giữ nút "Xem Celebration Card" (thay "Xem biên nhận")

**Props cần thêm:**
- `donationTransactionId: string | null` — để fetch dữ liệu giao dịch và render card

### File 3: `src/components/Chat/ChatMessageItem.tsx` — Cập nhật nhỏ

- Truyền thêm prop `donationTransactionId={message.donationTransactionId}` vào `ChatDonationCard`

### File 4: `src/components/Donate/GiftCelebrationModal.tsx` — Sửa metadata + tỉ lệ

**Sửa cấu trúc metadata** (dòng 266-277): Lưu phẳng thay vì lồng trong `celebration`:
```typescript
metadata: {
  theme: selectedTheme,
  background: activeBg,
  music: selectedMusic,
  custom_bg: !!customBgUrl,
}
```

**Cố định tỉ lệ 4:5** cho card (dòng 392-403): Thêm `aspect-[4/5]` vào div chứa card

### File 5: `src/components/Donate/EnhancedDonateModal.tsx` — Không thay đổi

---

## Tóm tắt thay đổi

| # | File | Thay đổi |
|---|------|----------|
| 1 | `DonationCelebrationCard.tsx` | Viết lại — hiển thị card có ảnh nền + tỉ lệ 4:5 + đầy đủ thông tin giao dịch; sửa đường dẫn đọc metadata |
| 2 | `ChatDonationCard.tsx` | Viết lại — fetch donation_transactions và render mini Celebration Card có ảnh nền thay vì text |
| 3 | `ChatMessageItem.tsx` | Truyền thêm prop `donationTransactionId` cho `ChatDonationCard` |
| 4 | `GiftCelebrationModal.tsx` | Sửa cấu trúc metadata (phẳng hoá); thêm `aspect-[4/5]` cho card |

---

## Kết quả mong đợi

1. **Profile**: Bài đăng donation hiển thị Celebration Card đầy đủ với ảnh nền theo chủ đề, tỉ lệ 4:5, giống hình 4 và 5
2. **Messenger**: Tin nhắn donation hiển thị mini Celebration Card (có ảnh nền, avatar, số tiền) thay vì chỉ text
3. **GiftCelebrationModal**: Card preview cũng có tỉ lệ 4:5 nhất quán
4. **Metadata**: Đồng bộ cấu trúc lưu và đọc — không bị fallback sai chủ đề

