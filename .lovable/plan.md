

# Hiệu ứng pháo hoa + đồng tiền CAMLY bay tung tóe toàn màn hình + bên trong Card

## Mục tiêu

- Pháo hoa + đồng tiền CAMLY/Fun Money bay **toàn màn hình** 15 giây khi mở
- **Bên trong Celebration Card**: hiệu ứng đồng tiền + sparkles lặp lại liên tục (như GIF) cho đến khi user bấm X
- Nút **X** để tắt hiệu ứng hình ảnh (pháo hoa, coin)
- Nút **loa** riêng để tắt/bật âm thanh Rich Rich Rich
- Nhạc Rich Rich Rich loop liên tục cho đến khi tắt

---

## Chi tiết kỹ thuật

### 1. Hiệu ứng toàn màn hình (15 giây)

**File: `src/components/Donate/GiftCelebrationModal.tsx`**

Giữ nguyên logic confetti hiện tại (bắn mỗi 1.5s trong 15s) nhưng nâng cấp:
- Thêm `CoinShowerEffect` ở **cấp toàn màn hình** (fixed overlay z-50) — 40 đồng tiền CAMLY + Fun Money rơi từ trên xuống
- Overlay toàn màn hình tự tắt sau 15 giây hoặc khi bấm X

### 2. Hiệu ứng bên trong Celebration Card (lặp liên tục)

**File: `src/components/Donate/GiftCelebrationModal.tsx`**

Tạo component `CardInternalEffects` render bên trong thẻ card (đã có `overflow-hidden`):
- 15-20 đồng tiền nhỏ (CAMLY coin + Fun Money) bay từ dưới lên, trôi ngang, lặp vô hạn
- Sparkle particles nhỏ lấp lánh
- Dùng CSS animation `coin-float` loop infinite (không cần JS interval)
- Hiệu ứng chỉ tắt khi user bấm X (state `showCardEffects`)

### 3. Tách nút X (hiệu ứng) và nút Loa (âm thanh)

Hiện tại có 2 nút: Volume + X. Điều chỉnh:
- **Nút Loa** (Volume2/VolumeX): chỉ tắt/bật âm thanh Rich Rich Rich
- **Nút X**: tắt toàn bộ hiệu ứng hình ảnh (pháo hoa màn hình + coin trong card)
- Khi tắt hiệu ứng: `showEffects = false` -> ẩn `CoinShowerEffect` toàn màn hình + `CardInternalEffects` trong card
- Âm thanh tiếp tục phát nếu user chỉ tắt hiệu ứng (và ngược lại)

### 4. Âm thanh loop liên tục

Thay đổi logic âm thanh:
- `audio.loop = true` — không giới hạn 15 giây nữa
- Chỉ dừng khi user bấm nút Loa hoặc đóng modal

### 5. CSS Animation mới

**File: `src/index.css`**

Thêm keyframe `coin-float` cho hiệu ứng bên trong card:
```css
@keyframes coin-float {
  0% { transform: translateY(100%) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-120%) rotate(360deg); opacity: 0; }
}
```

### 6. Cập nhật PreviewCelebration.tsx

Đồng bộ: MockDonationCelebrationCard và MockChatDonationCard thêm hiệu ứng coin float bên trong card tương tự.

---

## Tóm tắt

| # | File | Thay đổi |
|---|------|----------|
| 1 | `GiftCelebrationModal.tsx` | Thêm coin shower toàn màn hình + hiệu ứng coin/sparkle lặp bên trong card + tách nút X/Loa + audio loop liên tục |
| 2 | `src/index.css` | Thêm keyframe `coin-float` cho animation bên trong card |
| 3 | `PreviewCelebration.tsx` | Thêm hiệu ứng coin float bên trong mock cards |
