

# Chỉnh sửa tiêu đề và bố cục DonationCelebrationCard + PreviewCelebration

---

## Vấn đề hiện tại

1. **Nút Loa/X che tiêu đề** "🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉" — vì cả hai đều nằm ở `top-2 right-2`, chồng lên dòng tiêu đề.
2. **Tiêu đề** quá dài trên 1 dòng, font nhỏ (`text-sm`), có 2 icon 🎉 đầu cuối chiếm chỗ.
3. **Nút Save/Share** có thể dời sát viền hơn để tạo thêm không gian nội dung.

---

## Giải pháp

### 1. Thiết kế lại tiêu đề — 2 dòng, chữ to, Holographic gradient

**File: `src/components/Profile/DonationCelebrationCard.tsx`** (dòng 283-286)

Thay thế tiêu đề 1 dòng:
```
🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
```

Thành 2 dòng, xóa emoji, dùng gradient text theo FUN PLAY Design System (Cyan -> Purple -> Magenta):
```html
<div className="text-center pt-6">
  <p className="text-base font-extrabold tracking-widest"
     style={{
       background: "linear-gradient(to right, #00E7FF, #7A2BFF, #FF00E5, #FFD700)",
       WebkitBackgroundClip: "text",
       WebkitTextFillColor: "transparent",
       backgroundClip: "text",
       filter: "drop-shadow(0 0 8px rgba(0, 231, 255, 0.5))",
     }}>
    CHÚC MỪNG
  </p>
  <p className="text-sm font-bold tracking-wide"
     style={{
       background: "linear-gradient(to right, #FFD700, #FF00E5, #7A2BFF, #00E7FF)",
       WebkitBackgroundClip: "text",
       WebkitTextFillColor: "transparent",
       backgroundClip: "text",
       filter: "drop-shadow(0 0 6px rgba(255, 215, 0, 0.5))",
     }}>
    TẶNG THƯỞNG THÀNH CÔNG
  </p>
</div>
```

Thêm `pt-6` (padding-top) để tránh bị nút Loa/X che.

### 2. Dời nút Save/Share sát viền

**File: `src/components/Profile/DonationCelebrationCard.tsx`** (dòng 384-424)

Thay đổi padding bottom của container chính từ `p-5` thành `px-5 pt-5 pb-2` để nút Save/Share nằm sát viền dưới hơn, tạo thêm không gian cho nội dung ở giữa.

### 3. Đồng bộ PreviewCelebration.tsx

**File: `src/pages/PreviewCelebration.tsx`**

Cập nhật cả `MockDonationCelebrationCard` (dòng 116-118) và `MockChatDonationCard` (dòng 209) với cùng thiết kế:
- Tiêu đề 2 dòng, Holographic gradient, không emoji
- Thêm `pt-6` để tránh che bởi nút
- Padding bottom thu nhỏ

---

## Tóm tắt

| # | File | Thay đổi |
|---|------|----------|
| 1 | `DonationCelebrationCard.tsx` | Tiêu đề 2 dòng Holographic, `pt-6` tránh che, `pb-2` dời nút sát viền |
| 2 | `PreviewCelebration.tsx` | Đồng bộ tiêu đề 2 dòng + layout cho MockDonationCard và MockChatCard |

