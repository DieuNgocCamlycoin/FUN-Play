

## Sửa gradient vàng gold - Chuyển từ dọc sang ngang, sáng rực và phát quang

### Vấn đề hiện tại

Gradient hiện tại dùng hướng **dọc (180deg)**: sáng trên → tối giữa → sáng dưới. Điều này làm nút bị **tối ở giữa**, che mờ chữ tiêu đề, nhìn không đẹp.

### Giải pháp mới

Chuyển gradient sang hướng **ngang (90deg)** với tông vàng sáng rực, phát quang óng ánh như ánh kim loại đánh bóng. Thêm hiệu ứng aura glow mạnh hơn.

**Gradient mới (ngang, sáng rực):**
```
bg-[linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)]
```
- Sáng → sáng hơn → trắng vàng ở giữa → sáng → sáng: tạo vệt sáng phản chiếu ngang giữa nút
- Giữa nút sáng nhất (FFF8DC - trắng kem vàng) thay vì tối nhất
- Tổng thể rực rỡ, không có vùng tối

**Màu chữ đậm hơn để nổi trên nền sáng:** `#8B6914` (nâu vàng đậm, sắc nét)

**Border đồng nhất sáng:** `border-[#DAA520]` (goldenrod)

**Shadow aura vàng phát sáng mạnh:**
```
shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(255,215,0,0.6),0_0_50px_rgba(255,215,0,0.3)]
```

### Các tệp cần thay đổi (8 tệp)

| STT | Tệp | Nội dung |
|-----|------|----------|
| 1 | `src/components/Donate/GlobalDonateButton.tsx` | Cập nhật gradient ngang + shadow sáng (cả default và mobile) |
| 2 | `src/components/Layout/Header.tsx` | Cập nhật nút MINT |
| 3 | `src/pages/Watch.tsx` | Cập nhật nút "Thưởng & Tặng" dưới video |
| 4 | `src/components/Video/Mobile/VideoActionsBar.tsx` | Cập nhật nút mobile |
| 5 | `src/components/Profile/ProfileInfo.tsx` | Cập nhật nút profile |
| 6 | `src/components/FunMoney/MintableCard.tsx` | Cập nhật nút Mint |
| 7 | `src/components/FunMoney/TokenLifecyclePanel.tsx` | Cập nhật badge |
| 8 | `src/components/Wallet/ClaimRewardsSection.tsx` | Cập nhật nút Claim |

### Quy tắc thay thế toàn bộ

Tìm và thay nhất quán trong tất cả 8 tệp:

1. **Gradient**: `linear-gradient(180deg,#F9E37A_0%,#F0D96C_25%,#B78C1A_50%,#D4A94E_75%,#F9E37A_100%)` thay bằng `linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)`
2. **Màu chữ**: `text-[#A9710F]` thay bằng `text-[#8B6914]`
3. **Shadow chính**: Thay shadow tối bằng shadow sáng rực: `shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(255,215,0,0.6),0_0_50px_rgba(255,215,0,0.3)]`
4. **Hover shadow**: `hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_0_40px_rgba(255,215,0,0.8),0_0_80px_rgba(255,215,0,0.4)]`
5. **Border**: `border border-[#DAA520]/70` (đồng nhất, không chia trên/dưới tối/sáng nữa)
6. **Glossy highlight**: Giữ nguyên lớp sáng bóng phía trên
7. **Mirror shimmer**: Giữ nguyên hiệu ứng lướt sáng ngang

### Kết quả mong đợi

- Nút sáng rực, vàng golden óng ánh theo chiều ngang
- Vệt sáng trắng vàng ở giữa tạo hiệu ứng phản chiếu kim loại đánh bóng
- Không còn vùng tối ở giữa, chữ tiêu đề rõ ràng sắc nét
- Aura glow vàng tỏa sáng xung quanh nút
- Hiệu ứng shimmer lướt ngang tạo cảm giác kim loại sống động
- Đồng bộ toàn bộ 8 nút trên hệ thống

