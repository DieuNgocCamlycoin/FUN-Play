

# Cập Nhật Biên Nhận: Chủ Đề Tết Nguyên Đán 2026

## Tổng Quan

Thay thế chủ đề Valentine hiện tại trên cả hai loại biên nhận (Claim Receipt và Donation Receipt) bằng chủ đề Tết Nguyên Đán, có hiệu lực từ ngày 17/02/2026. Thiết kế mới sẽ thu hút người dùng chụp ảnh và chia sẻ trên mạng xã hội.

## Thay Đổi Chi Tiết

### File: `src/pages/Receipt.tsx`

#### 1. ClaimReceipt (dòng 82-215) -- Biên nhận rút thưởng CAMLY

**Header (dòng 86-108):**
- Thay gradient xanh lá sang gradient đỏ-vàng Tết: `from-red-600 via-red-500 to-yellow-500`
- Thay hiệu ứng trái tim trôi bằng hoa mai/đào trôi (unicode hoa)
- Thêm lời chúc Tết sau dòng "Rút thưởng CAMLY thành công":
  - "Chúc Mừng Năm Mới 2026 -- Năm Bính Ngọ"
  - "Phúc Lộc An Khang -- Vạn Sự Như Ý"
- Thay ribbon Valentine `💕 Happy Valentine's Day 💕` bằng ribbon Tết: `🧧 Chúc Mừng Năm Mới 🧧`

**Viền thẻ (dòng 84):**
- Thay `border-pink-300` sang `border-red-300` và `ring-pink` sang `ring-red`

**Footer (dòng 194-198):**
- Thay nền hồng Valentine sang nền đỏ-vàng Tết
- Nội dung: "🧧 Phúc Lộc Thọ -- FUN Play 🧧" và "Tết Nguyên Đán 2026"

**Hình ảnh Tết:**
- Thêm hình nền trang trí mai vàng (emoji hoa) và pháo hoa xung quanh header
- Thêm banner nhỏ với hình lì xì, đèn lồng bằng emoji/CSS art để người dùng chụp đẹp

#### 2. DonationReceipt (dòng 218-471) -- Biên nhận tặng quà

**Header (dòng 292-313):**
- Thay hiệu ứng trái tim hồng bằng hoa mai/đào
- Thay ribbon `💖 Happy Valentine's Day 💖` bằng `🧧 Chúc Mừng Năm Mới 🧧`

**Footer (dòng 450-454):**
- Thay Valentine footer sang Tết footer giống ClaimReceipt

## Thiết Kế Trực Quan

- Tông màu chính: đỏ (#DC2626), vàng (#EAB308), cam (#EA580C)
- Emoji trang trí: 🧧 (lì xì), 🏮 (đèn lồng), 🌸 (hoa đào), 🎆 (pháo hoa), 🎊 (confetti)
- Hiệu ứng animation: hoa mai rơi nhẹ thay thế trái tim trôi
- Banner Tết nổi bật ở giữa để người dùng screenshot chia sẻ

## Phạm Vi Ảnh Hưởng

- 1 file duy nhất: `src/pages/Receipt.tsx`
- Không thay đổi backend, không thay đổi Edge Function
- Áp dụng tự động cho cả web và mobile (dùng chung giao diện)

