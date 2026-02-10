

# Kế hoạch triển khai toàn diện Flow "Tặng & Thưởng" – FUN PLAY (Phiên bản cuối cùng)

---

## I. Tổng quan thay đổi

Theo prompt chuẩn mới, flow được cấu trúc lại hoàn toàn:

1. **Bước 1 - SendGiftModal**: Điền thông tin (đơn giản, không chủ đề, không nhạc)
2. **Bước 2 - Xác nhận & Ký MetaMask**: Bảng xác nhận đầy đủ
3. **Bước 3 - GiftCelebrationModal**: Celebration Card + Chọn chủ đề + Chọn background + Chọn nhạc + Hành động

**6 chủ đề mới** (thay 7 chủ đề cũ):
- 🎉 Chúc mừng | 🙏 Tri ân | 🎂 Sinh nhật | ❤️ Tình yêu | 🎊 Năm mới | 👨‍👩‍👧‍👦 Gia đình

**Loại bỏ**: Kết hôn (wedding), Cha mẹ (parents)
**Thêm mới**: Năm mới (newyear)

---

## II. Lưu 18 ảnh nền Celebration Card

Sao chép toàn bộ 18 ảnh vào `public/images/celebration-bg/`:

| Chủ đề | Ảnh 1 | Ảnh 2 | Ảnh 3 |
|---|---|---|---|
| 🎉 Chúc mừng | `celebration-1.png` | `celebration-2.png` | `celebration-3.png` |
| 🙏 Tri ân | `gratitude-1.png` | `gratitude-2.png` | `gratitude-3.png` |
| 🎂 Sinh nhật | `birthday-1.png` | `birthday-2.png` | `birthday-3.png` |
| ❤️ Tình yêu | `love-1.png` | `love-2.png` | `love-3.png` |
| 🎊 Năm mới | `newyear-1.png` | `newyear-2.png` | `newyear-3.png` |
| 👨‍👩‍👧‍👦 Gia đình | `family-1.png` | `family-2.png` | `family-3.png` |

Nguồn file:
- Đợt 1 (đã nhận): `chúc_mừng1-3.png`, `tri_ân1-3.png`, `sinh_nhật1-3.png`
- Đợt 2 (vừa nhận): `tình_yêu1-3.png`, `năm_mới1-3.png`, `gia_đình1-3.png`

---

## III. Chi tiết thay đổi từng file

### File 1: `src/components/Donate/EnhancedDonateModal.tsx`

#### Cập nhật DONATION_THEMES (6 chủ đề mới):

```typescript
const DONATION_THEMES = [
  { id: "celebration", emoji: "🎉", label: "Chúc mừng" },
  { id: "gratitude", emoji: "🙏", label: "Tri ân" },
  { id: "birthday", emoji: "🎂", label: "Sinh nhật" },
  { id: "love", emoji: "❤️", label: "Tình yêu" },
  { id: "newyear", emoji: "🎊", label: "Năm mới" },
  { id: "family", emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
];
```

#### Bước 1 — Nhập liệu (giữ nguyên hiện tại)
- Người gửi, Người nhận, Token, Số tiền, Lời nhắn
- **Không** có chủ đề, nhạc (đã đúng hiện tại)

#### Bước 2 — Xác nhận (đơn giản hoá)
- **Xoá** mục chọn chủ đề (dòng 414-430) khỏi bước 2
- **Xoá** mục chọn nhạc (dòng 432-467) khỏi bước 2
- **Xoá** stopPreview logic liên quan đến bước 2
- Chỉ giữ: Thông tin người gửi/nhận, số tiền, chain, cảnh báo, 2 nút điều hướng
- Mặc định `selectedTheme = "celebration"` và `selectedMusic = "rich-celebration"` (sẽ chọn ở bước 3)

#### Bước 3 — Chuyển sang GiftCelebrationModal
- Sau khi giao dịch thành công, hiển thị `GiftCelebrationModal` (component mới thay `DonationSuccessOverlay`)
- Truyền thêm callback để chọn chủ đề/nhạc/background tại bước 3

---

### File 2: `src/components/Donate/DonationSuccessOverlay.tsx` → Đổi tên thành `GiftCelebrationModal.tsx`

#### Viết lại hoàn toàn thành GiftCelebrationModal:

**A. Cấu trúc dữ liệu ảnh nền:**

```typescript
const THEME_BACKGROUNDS: Record<string, string[]> = {
  celebration: [
    "/images/celebration-bg/celebration-1.png",
    "/images/celebration-bg/celebration-2.png",
    "/images/celebration-bg/celebration-3.png",
  ],
  gratitude: [
    "/images/celebration-bg/gratitude-1.png",
    "/images/celebration-bg/gratitude-2.png",
    "/images/celebration-bg/gratitude-3.png",
  ],
  birthday: [
    "/images/celebration-bg/birthday-1.png",
    "/images/celebration-bg/birthday-2.png",
    "/images/celebration-bg/birthday-3.png",
  ],
  love: [
    "/images/celebration-bg/love-1.png",
    "/images/celebration-bg/love-2.png",
    "/images/celebration-bg/love-3.png",
  ],
  newyear: [
    "/images/celebration-bg/newyear-1.png",
    "/images/celebration-bg/newyear-2.png",
    "/images/celebration-bg/newyear-3.png",
  ],
  family: [
    "/images/celebration-bg/family-1.png",
    "/images/celebration-bg/family-2.png",
    "/images/celebration-bg/family-3.png",
  ],
};
```

**B. Nội dung Celebration Card (bắt buộc đầy đủ):**
- Avatar + tên + @username người gửi (link profile)
- Ví người gửi rút gọn + nút COPY
- Mũi tên animation + Số lượng + Token icon
- Avatar + tên + @username người nhận (link profile)
- Ví người nhận rút gọn + nút COPY
- Lời nhắn (nếu có)
- Thời gian (vi-VN)
- Chain (BSC / Nội bộ)
- TX Hash rút gọn + COPY + mở Explorer
- Mã biên nhận

**C. Chọn chủ đề (TẠI BƯỚC 3):**
- 6 nút emoji, lưới 3 cột
- Khi chọn chủ đề → tự động hiển thị 3 background tương ứng
- Mặc định: "celebration" + background đầu tiên

**D. Chọn background:**
- 3 ảnh hệ thống theo chủ đề đã chọn (thumbnail nhỏ, click để chọn)
- Background được chọn sẽ làm nền cho Celebration Card (cover, opacity overlay để nội dung đọc được)

**E. Âm thanh:**
- 3 tuỳ chọn nhạc với nút nghe thử (giữ logic hiện tại)
- Phát tự động khi mở modal

**F. Hiệu ứng:**
- Confetti canvas (giữ 4 đợt hiện tại)
- Hiệu ứng đồng CAMLY Coin + Fun Money bay (sử dụng `/images/camly-coin.png` và `/images/fun-money-coin.png`)
- CSS animation theo chủ đề (giữ các keyframe hiện tại)

**G. Nút hành động trên Card (6 nút):**
1. 📥 **Lưu hình ảnh** — Chụp screenshot card bằng `html2canvas` (cần thêm thư viện) hoặc dùng Canvas API
2. 🔗 **Chia sẻ** — Copy link biên nhận
3. 🧾 **Sao chép Tx Hash** — Copy TX hash
4. 📣 **Đăng lên Profile** — Tự động đăng (giữ logic hiện tại)
5. 💬 **Gửi tin nhắn** — Gửi tin nhắn cho người nhận (mới)
6. ❌ **Đóng**

---

### File 3: Tính năng AUTO MESSAGE (Gửi tin nhắn cho người nhận)

Thêm logic trong GiftCelebrationModal:

1. Tìm hoặc tạo cuộc trò chuyện giữa sender và receiver (`user_chats`)
2. Gửi tin nhắn loại `donation` vào `chat_messages`:
   - `message_type: "donation"`
   - `donation_transaction_id`: liên kết giao dịch
   - `content`: Nội dung text đầy đủ (emoji + tên + số tiền + token + lời nhắn)
   - `deep_link`: `/receipt/{receipt_public_id}`

**Bảng `chat_messages` đã có** các cột: `message_type`, `donation_transaction_id`, `deep_link` — đã sẵn sàng.

**Bảng `user_chats`** — cần kiểm tra hoặc tạo cuộc trò chuyện:
```typescript
// Tìm chat hiện có
const { data: existingChat } = await supabase
  .from("user_chats")
  .select("id")
  .or(`and(user1_id.eq.${sender.id},user2_id.eq.${receiver.id}),and(user1_id.eq.${receiver.id},user2_id.eq.${sender.id})`)
  .single();

// Nếu chưa có → tạo mới
if (!existingChat) {
  const { data: newChat } = await supabase
    .from("user_chats")
    .insert({ user1_id: sender.id, user2_id: receiver.id })
    .select("id")
    .single();
}

// Gửi tin nhắn
await supabase.from("chat_messages").insert({
  chat_id: chatId,
  sender_id: sender.id,
  message_type: "donation",
  content: `🎁 ${sender.name} đã tặng bạn ${amount} ${token.symbol}! ...`,
  donation_transaction_id: transaction.id,
  deep_link: `/receipt/${transaction.receipt_public_id}`,
});
```

---

### File 4: `src/components/Profile/DonationCelebrationCard.tsx`

Cập nhật cho 6 chủ đề mới:
- Xoá `wedding`, `parents` khỏi `THEME_LABELS`, `THEME_GRADIENTS`, `THEME_BORDERS`
- Thêm `newyear`
- Thêm hiển thị background image nếu có (lưu trong metadata giao dịch)

---

### File 5: `src/components/Profile/PostCard.tsx`

Giữ nguyên — đã hoạt động đúng với `DonationCelebrationCard`.

---

### File 6: `src/components/Transactions/TransactionCard.tsx`

Thêm nút **"Xem Card Chúc Mừng"** cho giao dịch donation:

```typescript
// Thêm vào footer (dòng 218-271)
{transaction.source_table === "donation_transactions" && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => navigate(`/receipt/${transaction.id}`)}
    className="text-xs text-amber-500"
  >
    🎉 Xem Card Chúc Mừng
  </Button>
)}
```

Cần truy xuất `receipt_public_id` từ `donation_transactions` — hoặc lưu trực tiếp vào `UnifiedTransaction`.

Cập nhật `useTransactionHistory.ts`:
- Thêm field `receipt_public_id` vào `UnifiedTransaction` interface
- Map từ `donation_transactions.receipt_public_id`

---

### File 7: `src/index.css`

Giữ nguyên 6 keyframes hiện tại, cập nhật:
- Xoá animation classes cho `wedding`, `parents`
- Thêm animation class cho `newyear` (ví dụ: `animate-fireworks`)

---

### File 8: Hiệu ứng đồng coin bay

Thêm component con `CoinShowerEffect` trong GiftCelebrationModal:
- Sử dụng CSS animation hoặc canvas
- Hiển thị ảnh `/images/camly-coin.png` và `/images/fun-money-coin.png` bay tung toé
- Không che nội dung card (pointer-events-none, z-index thấp)

---

## IV. Bảng tổng hợp file cần thay đổi

| # | File | Loại | Mô tả |
|---|------|------|-------|
| 1-18 | `public/images/celebration-bg/*.png` | Tạo mới | 18 ảnh nền cho 6 chủ đề |
| 19 | `src/components/Donate/EnhancedDonateModal.tsx` | Cập nhật | Xoá theme/music ở bước 2, cập nhật 6 chủ đề mới, import GiftCelebrationModal |
| 20 | `src/components/Donate/DonationSuccessOverlay.tsx` | Viết lại | Đổi thành GiftCelebrationModal — thêm chọn theme/background/nhạc, 6 nút hành động, auto message, coin shower |
| 21 | `src/components/Profile/DonationCelebrationCard.tsx` | Cập nhật | 6 chủ đề mới, hỗ trợ background image |
| 22 | `src/components/Transactions/TransactionCard.tsx` | Cập nhật nhỏ | Thêm nút "Xem Card Chúc Mừng" |
| 23 | `src/hooks/useTransactionHistory.ts` | Cập nhật nhỏ | Thêm `receipt_public_id` vào UnifiedTransaction |
| 24 | `src/index.css` | Cập nhật nhỏ | Thêm keyframe newyear, xoá wedding/parents, thêm coin shower animation |

---

## V. Các file KHÔNG cần thay đổi

| File | Lý do |
|---|---|
| `src/hooks/useDonation.ts` | Đã hỗ trợ `theme` và `music` |
| `src/hooks/useChatMessages.ts` | Đã hỗ trợ `message_type: "donation"` |
| `supabase/functions/create-donation/index.ts` | Đã lưu metadata |
| `src/components/Profile/PostCard.tsx` | Đã tích hợp DonationCelebrationCard |

---

## VI. Flow hoàn chỉnh sau triển khai

```
Người gửi mở Modal
  → Bước 1: Điền người nhận, token, số tiền, lời nhắn
  → Bước 2: Xem bảng xác nhận → Bấm "Xác nhận & Tặng" → Ký MetaMask (nếu BSC)
  → Bước 3: GiftCelebrationModal hiện ra:
      - Confetti bắn + Coin bay + Nhạc phát
      - Celebration Card với đầy đủ thông tin
      - Chọn chủ đề (6 loại) → Hiển thị 3 background tương ứng
      - Chọn background cho card
      - Chọn nhạc (3 bản Rich)
      - 6 nút: Lưu ảnh | Chia sẻ | Copy TX | Đăng Profile | Gửi tin nhắn | Đóng
      
  → TỰ ĐỘNG:
      1. Đăng bài lên Profile (kèm Celebration Card)
      2. Gửi tin nhắn cho người nhận (kèm link card)
      3. Lưu lịch sử giao dịch (có nút "Xem Card Chúc Mừng")
```

---

## VII. Kết quả mong đợi

1. **Bước nhập liệu**: Gọn gàng — 5 trường cơ bản
2. **Bước xác nhận**: Rõ ràng — chỉ thông tin giao dịch + cảnh báo
3. **Celebration Card**: Hoành tráng — ảnh nền đẹp theo chủ đề, hiệu ứng coin bay, nhạc Rich!, đầy đủ thông tin Web3
4. **Tự động lan toả**: Đăng Profile (kèm Celebration Card) + Gửi tin nhắn cho người nhận
5. **Lịch sử**: Nút "Xem Card Chúc Mừng" mở lại đúng theme + nhạc + hiệu ứng
6. **Cảm xúc**: "ĐÃ – ĐẸP – MUỐN KHOE – MUỐN CHIA SẺ – MUỐN TẶNG TIẾP"

