

# Kế hoạch nâng cấp toàn diện hệ thống "Thưởng & Tặng" – FUN PLAY

---

## I. Mục tiêu

Chuyển đổi trải nghiệm "Thưởng & Tặng" thành nghi thức chúc mừng cao cấp:

**Đơn giản khi nhập → Hoành tráng khi xác nhận → Lan toả mạnh sau khi tặng.**

- Loại bỏ hoàn toàn GIF ngẫu nhiên từ Giphy
- Thay bằng **Celebration Card** — thẻ chúc mừng CSS/React đầy đủ thông tin
- Tự động đăng bài kèm Celebration Card lên profile người gửi

---

## II. Lưu 3 file âm thanh

Sao chép 3 file người dùng đã upload vào `public/audio/`:

| File gốc | Đường dẫn đích | Vai trò |
|---|---|---|
| `Rich_2_prompt_3-2.mp3` | `public/audio/rich-celebration.mp3` | Ghi đè — "Rich! Rich! Rich!" (mặc định) |
| `Rich-2.mp3` | `public/audio/rich-2.mp3` | "Rich Vibe" |
| `Rich3-2.mp3` | `public/audio/rich-3.mp3` | "Rich Energy" |

---

## III. Chi tiết thay đổi từng file

### File 1: `src/components/Donate/EnhancedDonateModal.tsx`

#### Bước 1 — Nhập liệu (đơn giản hoá)

**Xoá hoàn toàn:**
- Import `Slider` (dòng 9)
- Import `RadioGroup`, `RadioGroupItem` (dòng 11)
- Hằng số `MUSIC_OPTIONS` (dòng 63–67)
- Hàm `handleSliderChange` (dòng 217)
- Thanh kéo `<Slider>` và điều kiện bao quanh (dòng 523–525)
- Mục "Chủ đề tặng thưởng" (dòng 534–550)
- Mục "Chọn nhạc" với `RadioGroup` (dòng 552–566)

**Giữ nguyên:**
- Người gửi (avatar + tên + @username + ví rút gọn + copy)
- Người nhận (tìm kiếm + avatar + tên + ví + copy + nút xoá)
- Token (dropdown)
- Số tiền: 4 nút preset (10 / 50 / 100 / 500) + ô nhập tuỳ chỉnh
- Xác nhận: "Bạn sẽ tặng: XXX TOKEN"
- Lời nhắn yêu thương (textarea + emoji picker)
- Nút: **"Xem lại & Xác nhận →"**

#### Bước 2 — Xác nhận (trung tâm cảm xúc)

**Giữ nguyên:** hiển thị người gửi, người nhận, số tiền, chain, cảnh báo blockchain, 2 nút điều hướng.

**Thêm mới vào bước này:**

1. **Chọn chủ đề chúc mừng** — 7 nút emoji (dùng lại mảng `DONATION_THEMES` hiện có):
   - 🎉 Chúc mừng | 💍 Kết hôn | 🎂 Sinh nhật | 🙏 Tri ân | ❤️ Tình yêu | 👨‍👩‍👧‍👦 Gia đình | 🌱 Cha mẹ
   - Giao diện: lưới 4 cột, viền sáng khi chọn

2. **Chọn âm nhạc** — 3 file thực (thay `MUSIC_OPTIONS` cũ):

```typescript
const MUSIC_OPTIONS = [
  { id: "rich-celebration", label: "Rich! Rich! Rich!", description: "Mặc định", src: "/audio/rich-celebration.mp3" },
  { id: "rich-2", label: "Rich Vibe", description: "Năng lượng tích cực", src: "/audio/rich-2.mp3" },
  { id: "rich-3", label: "Rich Energy", description: "Giàu có & yêu thương", src: "/audio/rich-3.mp3" },
];
```

   - Mỗi tuỳ chọn có **nút ▶ nghe thử** (play/pause toggle)
   - Dùng `useRef<HTMLAudioElement>` để quản lý; phát 5 giây rồi tự dừng
   - Khi chuyển bài hoặc rời bước: dừng bài đang phát

3. Hiển thị lời nhắn (nếu có)

---

### File 2: `src/components/Donate/DonationSuccessOverlay.tsx`

#### Xoá hoàn toàn:
- Object `THEME_GIFS` (dòng 57–80) — tất cả URL Giphy
- Biến `themeGifs`, `randomGif` (dòng 150–151)
- Thẻ `<img src={randomGif}>` (dòng 209–213)
- Nút "Lưu GIF" + logic download (dòng 307–315)
- Import `Download` (dòng 2)
- `gif_url: randomGif` trong `handleShareToProfile` (dòng 167)

#### Thay bằng Celebration Card:

Một `<div>` styled theo chủ đề, hiển thị:

| Thành phần | Mô tả |
|---|---|
| Tiêu đề | 🎉🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉🎉 |
| Nền thẻ | Gradient CSS theo chủ đề (bảng bên dưới) |
| Hiệu ứng | CSS animation riêng theo chủ đề |
| Confetti | Giữ nguyên 4 đợt confetti canvas |
| Âm thanh | Phát đúng file nhạc đã chọn |
| Người gửi | Avatar + tên + @username + ví rút gọn + copy |
| Mũi tên animation | Số tiền + Token icon |
| Người nhận | Avatar + tên + @username + ví rút gọn + copy |
| Chủ đề | Emoji + tên chủ đề |
| Lời nhắn | Hiển thị nếu có |
| Thời gian | Định dạng vi-VN |
| Chain | BSC / Nội bộ |
| TX Hash | Rút gọn + copy + link explorer |
| Mã biên nhận | #receipt_public_id |

#### Phát nhạc theo lựa chọn:

```typescript
const MUSIC_FILES: Record<string, string> = {
  "rich-celebration": "/audio/rich-celebration.mp3",
  "rich-2": "/audio/rich-2.mp3",
  "rich-3": "/audio/rich-3.mp3",
};
```

Thay thế logic cũ (dòng 110–118) — phát đúng file theo `music` prop, fallback về `rich-celebration`.

#### Bảng chủ đề & hiệu ứng CSS:

| Chủ đề | Gradient nền | Hiệu ứng CSS |
|---|---|---|
| 🎉 Chúc mừng | amber → pink → purple | `confetti-fall` |
| 💍 Kết hôn | rose → amber | `sparkle-shimmer` |
| 🎂 Sinh nhật | pink → yellow → cyan | `confetti-fall` |
| 🙏 Tri ân | emerald → teal | `gentle-glow` |
| ❤️ Tình yêu | red → pink → rose | `float-hearts` |
| 👨‍👩‍👧‍👦 Gia đình | blue → indigo → purple | `warm-rays` |
| 🌱 Cha mẹ | green → emerald → teal | `grow-up` |

#### Tự động đăng bài kèm Celebration Card lên Profile:

Cập nhật `handleShareToProfile` (dòng 154–180):
- Xoá `gif_url: randomGif`
- Thêm trường `metadata` dạng JSON vào `content` — chứa thông tin giao dịch (sender, receiver, amount, token, theme, receipt_id) để `PostCard` có thể render lại Celebration Card
- Nội dung bài đăng: text đầy đủ (emoji chủ đề + tên người gửi/nhận + số tiền + token + lời nhắn + link biên nhận + hashtag)
- Thêm trường `donation_transaction_id` (bảng `posts` đã có cột này) để liên kết bài đăng với giao dịch

#### Nút hành động (giữ 2 nút):
- "Sao chép link biên nhận"
- "Chia sẻ lên Profile" (tự động gọi khi mở, bỏ nút "Lưu GIF")
- Nút ❌ đóng

---

### File 3: `src/components/Profile/PostCard.tsx`

#### Thêm hiển thị Celebration Card cho bài đăng donation:

Khi `post.post_type === "donation"`, thay vì chỉ hiển thị GIF ngẫu nhiên qua `post.gif_url`, sẽ render một **Celebration Card mini** trực tiếp trong bài đăng:

- Trích xuất thông tin giao dịch từ `post.donation_transaction_id` (query `donation_transactions` + `profiles`)
- Hoặc parse từ nội dung `post.content` (fallback nếu không có `donation_transaction_id`)
- Hiển thị thẻ Celebration Card nhỏ gọn:
  - Nền gradient theo chủ đề (từ metadata)
  - Tiêu đề: "🎉 Tặng thưởng thành công"
  - Avatar + tên người gửi → Số tiền + Token → Avatar + tên người nhận
  - Lời nhắn (nếu có)
  - Nút "Xem biên nhận" dẫn đến `/receipt/...`

Tạo component con `DonationCelebrationCard` (inline hoặc file riêng) để tái sử dụng.

---

### File 4: `src/index.css`

Thêm 6 CSS keyframes mới (cuối file):

```css
@keyframes float-hearts {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
}
@keyframes sparkle-shimmer {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}
@keyframes confetti-fall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(20px) rotate(360deg); opacity: 0; }
}
@keyframes gentle-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.6); }
}
@keyframes warm-rays {
  0%, 100% { opacity: 0.4; transform: rotate(0deg); }
  50% { opacity: 0.8; transform: rotate(5deg); }
}
@keyframes grow-up {
  0% { transform: scaleY(0.8); opacity: 0.6; }
  100% { transform: scaleY(1); opacity: 1; }
}
```

Kèm class tiện ích tương ứng: `.animate-float-hearts`, `.animate-sparkle-shimmer`, v.v.

---

## IV. Các file không cần thay đổi

| File | Lý do |
|---|---|
| `src/hooks/useDonation.ts` | Đã hỗ trợ tham số `theme` và `music` (dòng 54–55) |
| `supabase/functions/create-donation/index.ts` | Đã nhận và lưu `theme`, `music` vào metadata |

---

## V. Bảng tổng hợp file cần thay đổi

| # | File | Loại | Mô tả |
|---|------|------|-------|
| 1 | `public/audio/rich-celebration.mp3` | Ghi đè | File "Rich! Rich! Rich!" mới |
| 2 | `public/audio/rich-2.mp3` | Tạo mới | File "Rich Vibe" |
| 3 | `public/audio/rich-3.mp3` | Tạo mới | File "Rich Energy" |
| 4 | `src/components/Donate/EnhancedDonateModal.tsx` | Cập nhật | Xoá slider/chủ đề/nhạc ở bước 1; chuyển sang bước 2 với nghe thử |
| 5 | `src/components/Donate/DonationSuccessOverlay.tsx` | Cập nhật lớn | Xoá GIF Giphy; thay bằng Celebration Card; phát đúng nhạc |
| 6 | `src/components/Profile/PostCard.tsx` | Cập nhật | Render Celebration Card mini cho bài đăng donation |
| 7 | `src/index.css` | Cập nhật nhỏ | Thêm 6 CSS keyframes cho hiệu ứng chủ đề |

---

## VI. Kết quả mong đợi

1. **Bước nhập:** Gọn gàng — chỉ 5 trường cơ bản, không slider, không chủ đề, không nhạc.
2. **Bước xác nhận:** Hoành tráng — xem đầy đủ thông tin, chọn chủ đề, nghe thử 3 bản nhạc.
3. **Màn hình thành công:** Celebration Card đẹp — hiệu ứng CSS theo chủ đề, nhạc thực từ 3 file, đầy đủ thông tin Web3, **không còn GIF ngẫu nhiên**.
4. **Tự động đăng bài:** Bài viết trên profile hiển thị **Celebration Card trực tiếp** (không phải GIF ngẫu nhiên, không phải chỉ text) — cho đẹp và chuyên nghiệp.
5. **Toàn bộ trải nghiệm:** Nghi thức chúc mừng & lan toả yêu thương.

