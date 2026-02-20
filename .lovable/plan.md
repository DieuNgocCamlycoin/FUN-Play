

## Nâng cấp bảng màu Vàng Gold cho nút "Thưởng & Tặng" và "MINT" toàn hệ thống

### Phân tích hiện trạng

Hiện tại cả 2 nút đang sử dụng bảng màu vàng nhạt: `#FFEA00 → #FFD700 → #E5A800`. Bảng màu này khá sáng, thiếu chiều sâu kim loại (metallic depth) so với bảng vàng gold cao cấp trong hình tham chiếu.

### Bảng màu mới (theo hình tham chiếu)

Sử dụng các mã màu từ hình HERSAN DESIGN để tạo hiệu ứng vàng kim loại sang trọng hơn:

| Vị trí | Cũ | Mới | Mô tả |
|--------|-----|-----|-------|
| Gradient Start | #FFEA00 | #F9E37A | Vàng sáng ấm |
| Gradient Mid | #FFD700 | #F0D96C | Vàng trung |
| Gradient End | #E5A800 | #B78C1A | Vàng đậm kim loại |
| Text | #7C5800 | #A9710F | Nâu vàng đậm, dễ đọc hơn |
| Border | #FFEA00/60 | #C28F1A/60 | Viền vàng đậm |
| Shadow Glow | rgba(255,215,0) | rgba(198,143,26) | Ánh vàng ấm hơn |
| Hover Glow | rgba(255,234,0) | rgba(240,217,108) | Ánh sáng hover |
| Shimmer | white/40 | white/30 | Giữ shimmer nhẹ hơn |

### Các tệp cần thay đổi

| STT | Tệp | Nội dung |
|-----|------|----------|
| 1 | `src/components/Donate/GlobalDonateButton.tsx` | Cập nhật gradient + shadow + border cho cả variant default và mobile |
| 2 | `src/components/Layout/Header.tsx` | Cập nhật nút MINT trên thanh Header desktop |
| 3 | `src/pages/Watch.tsx` | Cập nhật nút "Thưởng & Tặng" dưới video |
| 4 | `src/components/Video/Mobile/VideoActionsBar.tsx` | Cập nhật nút Tặng trên mobile video |
| 5 | `src/components/Profile/ProfileInfo.tsx` | Cập nhật nút Tặng trên trang Profile |
| 6 | `src/components/FunMoney/MintableCard.tsx` | Cập nhật nút Mint trong trang FUN Money |
| 7 | `src/components/FunMoney/TokenLifecyclePanel.tsx` | Cập nhật badge lifecycle |
| 8 | `src/components/Wallet/ClaimRewardsSection.tsx` | Cập nhật nút Claim Rewards |

### Quy tắc thay thế toàn bộ

Tìm và thay thế nhất quán trong tất cả 8 tệp:

- `from-[#FFEA00]` thay bằng `from-[#F9E37A]`
- `via-[#FFD700]` thay bằng `via-[#F0D96C]`
- `to-[#E5A800]` thay bằng `to-[#B78C1A]`
- `text-[#7C5800]` thay bằng `text-[#A9710F]`
- `border-[#FFEA00]` thay bằng `border-[#C28F1A]`
- `rgba(255,215,0,...)` thay bằng `rgba(198,143,26,...)`
- `rgba(255,234,0,...)` thay bằng `rgba(240,217,108,...)`

### Kết quả mong đợi

- Tất cả nút "Thưởng & Tặng" và "MINT" trên toàn hệ thống (Header, Watch, Profile, Mobile, Wallet, FUN Money) sẽ có tông vàng kim loại sang trọng hơn, giống thanh vàng gold trong hình tham chiếu
- Hiệu ứng mirror shimmer vẫn giữ nguyên
- Chiều sâu metallic tốt hơn nhờ gradient từ vàng sáng ấm xuống vàng nâu đậm

