
# Cập Nhật Nút WALLET Theo Style "Claim Rewards" Holographic Rainbow

## Phân Tích Hình Ảnh Reference

Từ hình ảnh con gửi, nút **"Claim Rewards"** cũ có:
- **Gradient cầu vồng** (Rainbow Holographic): Xanh lá → Vàng → Cam → Hồng → Tím → Xanh dương
- **Border mềm** với hiệu ứng glow
- **Text màu trắng** hoặc màu sáng để tương phản
- **Icon xoay tròn** với các vòng tròn đồng tâm
- **Badge đỏ/hồng** ở góc trên phải

## Thay Đổi Cần Thực Hiện

### File: `src/components/Wallet/WalletButton.tsx`

**Từ style hiện tại (Premium 5D Gold):**
```typescript
"bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] text-[#7C5800]"
```

**Sang style mới (Rainbow Holographic):**
```typescript
"bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-pink-400 via-purple-400 to-cyan-400 text-white"
```

### Chi Tiết Kỹ Thuật

| Thuộc tính | Giá trị cũ (Gold) | Giá trị mới (Rainbow) |
|------------|-------------------|----------------------|
| Gradient direction | `to-b` (dọc) | `to-r` (ngang) |
| Colors | `#FFEA00 → #FFD700 → #E5A800` | `green → yellow → orange → pink → purple → cyan` |
| Text color | `#7C5800` (dark gold) | `white` |
| Box shadow | Gold glow | Rainbow glow |
| Shimmer | White stripe | White stripe (giữ nguyên) |

### Code Cụ Thể

```typescript
// Desktop version
className={cn(
  "relative gap-2 font-bold transition-all duration-300 overflow-hidden",
  hasRewards
    ? "bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-pink-400 via-purple-400 to-cyan-400 text-white hover:opacity-90"
    : "bg-gradient-to-r from-green-400/70 via-yellow-400/70 via-pink-400/70 to-cyan-400/70 text-white/90 border border-white/20"
)}
style={{
  boxShadow: hasRewards 
    ? "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)"
    : "0 0 10px rgba(168, 85, 247, 0.2)"
}}
```

### Hiệu Ứng Animation

- Giữ nguyên **Mirror Shimmer** để tạo ánh sáng chạy qua
- Có thể thêm **animate-rainbow-gradient** để màu sắc chuyển động nhẹ

## Kết Quả Mong Đợi

Nút WALLET sẽ có style **giống hệt** nút "Claim Rewards" trong hình:
- Gradient cầu vồng holographic đẹp mắt
- Text trắng dễ đọc
- Hiệu ứng glow tím/hồng xung quanh
- Badge đỏ hiển thị số rewards
- Shimmer effect tạo cảm giác sang trọng

## Files Thay Đổi

| File | Hành động |
|------|-----------|
| `src/components/Wallet/WalletButton.tsx` | Cập nhật gradient và colors |
