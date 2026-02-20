

## Nâng cấp Luxury Metallic Style cho nút "THƯỞNG & TẶNG" và "MINT"

### Hiện trạng

Các nút hiện có gradient vàng gold cơ bản (`from-[#F9E37A] via-[#F0D96C] to-[#B78C1A]`) với hiệu ứng shimmer đơn giản. Cần nâng lên phong cách luxury metallic với chiều sâu kim loại thực sự.

### Thiết kế mới - Luxury Metallic

Thêm các lớp hiệu ứng chồng lên nhau để tạo cảm giác kim loại 3D:

| Lớp | Hiệu ứng | Mô tả |
|-----|----------|-------|
| 1 - Base | Multi-stop gradient | Gradient 5 điểm mô phỏng phản chiếu kim loại: sáng - trung - đậm - trung - sáng |
| 2 - Glossy highlight | Overlay gradient trắng | Dải sáng bóng phía trên nút (top 40%) |
| 3 - Inner shadow | inset box-shadow | Bóng đổ bên trong tạo chiều sâu lõm kim loại |
| 4 - Outer glow | Soft outer box-shadow | Aura vàng lan tỏa xung quanh nút |
| 5 - Shimmer | Animated sweep | Giữ hiệu ứng lướt sáng hiện tại |

### Chi tiết kỹ thuật

**1. Gradient kim loại 5 điểm dừng (thay gradient 3 điểm):**
```
bg-[linear-gradient(180deg,#F9E37A_0%,#F0D96C_25%,#B78C1A_50%,#D4A94E_75%,#F9E37A_100%)]
```
Tạo hiệu ứng phản chiếu trên bề mặt kim loại cong.

**2. Glossy highlight overlay (lớp mới):**
```html
<div class="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-full pointer-events-none" />
```

**3. Inner shadow nâng cấp:**
```
shadow-[
  inset_0_2px_4px_rgba(255,255,255,0.7),
  inset_0_-2px_6px_rgba(120,70,10,0.3),
  0_0_20px_rgba(198,143,26,0.5),
  0_2px_8px_rgba(120,70,10,0.4)
]
```

**4. Hover aura effect:**
```
hover:shadow-[
  inset_0_2px_4px_rgba(255,255,255,0.8),
  inset_0_-2px_6px_rgba(120,70,10,0.3),
  0_0_35px_rgba(240,217,108,0.7),
  0_0_60px_rgba(198,143,26,0.3),
  0_2px_8px_rgba(120,70,10,0.4)
]
```

**5. Border nâng cấp:** Thêm `border-t-[#F9E37A]/80` sáng hơn viền trên, `border-b-[#8B6914]/60` tối hơn viền dưới để tăng chiều sâu 3D.

### Các tệp cần thay đổi

| STT | Tệp | Nội dung |
|-----|------|----------|
| 1 | `src/components/Donate/GlobalDonateButton.tsx` | Nâng cấp cả variant default và mobile |
| 2 | `src/components/Layout/Header.tsx` | Nâng cấp nút MINT |
| 3 | `src/pages/Watch.tsx` | Nâng cấp nút "Thưởng & Tặng" dưới video |
| 4 | `src/components/Video/Mobile/VideoActionsBar.tsx` | Nâng cấp nút mobile |
| 5 | `src/components/Profile/ProfileInfo.tsx` | Nâng cấp nút profile |
| 6 | `src/components/FunMoney/MintableCard.tsx` | Nâng cấp nút Mint |
| 7 | `src/components/FunMoney/TokenLifecyclePanel.tsx` | Nâng cấp badge |
| 8 | `src/components/Wallet/ClaimRewardsSection.tsx` | Nâng cấp nút Claim |
| 9 | `src/index.css` | Thêm animation `luxury-pulse` cho outer glow nhấp nháy nhẹ |

### Animation mới trong index.css

Thêm hiệu ứng `luxury-pulse` - aura glow nhấp nháy nhẹ nhàng:
```css
@keyframes luxury-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(198,143,26,0.4); }
  50% { box-shadow: 0 0 30px rgba(240,217,108,0.6); }
}
```

### Kết quả mong đợi

- Nút có cảm giác 3D kim loại thực sự nhờ gradient phản chiếu 5 điểm
- Glossy highlight tạo hiệu ứng bóng loáng như bề mặt kim loại đánh bóng
- Inner shadow cho chiều sâu, outer glow tạo aura sang trọng
- Hover tạo hiệu ứng "phát sáng" mạnh hơn, nút như đang tỏa ánh vàng
- Tất cả 8 nút trên toàn hệ thống đồng bộ cùng phong cách luxury metallic

