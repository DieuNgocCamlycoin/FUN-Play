

## Đồng bộ nút "Thưởng & Tặng" trên trang Watch

### Vấn đề hiện tại

Trang Watch đang sử dụng **DonateModal cũ** (đơn giản, chỉ có chọn token + nhập số lượng) thay vì **EnhancedDonateModal** (phiên bản nâng cấp với đầy đủ tính năng: chọn chủ đề, emoji, nhạc nền, hiệu ứng ăn mừng, Celebration Card...). Nút bấm cũng chỉ hiển thị "Tặng" với kiểu dáng đơn giản, không đồng bộ với nút "THƯỞNG & TẶNG" trên thanh Header và trang Profile cá nhân.

### Giải pháp

Thay thế `DonateModal` bằng `EnhancedDonateModal` và nâng cấp giao diện nút thành phong cách vàng gold đặc trưng giống GlobalDonateButton.

### Chi tiết kỹ thuật

| STT | Tệp | Nội dung thay đổi |
|-----|------|-------------------|
| 1 | `src/pages/Watch.tsx` | Thay thế import và sử dụng DonateModal bang EnhancedDonateModal, nâng cấp nút "Tặng" thành "Thưởng & Tặng" với style gold |

**Thay đổi cụ thể trong Watch.tsx:**

1. **Import**: Thay `DonateModal` bằng `EnhancedDonateModal`
   - Xóa: `import { DonateModal } from "@/components/Donate/DonateModal";`
   - Thêm: `import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";`

2. **Nút bấm (dòng 861-870)**: Thay nút "Tặng" đơn giản bằng nút "Thưởng & Tặng" với style gold đặc trưng
   - Trước: `bg-muted` + icon Gift + text "Tặng"
   - Sau: Gradient vàng gold `bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800]` + text "Thưởng & Tặng" + hiệu ứng mirror shimmer (giống GlobalDonateButton)

3. **Component DonateModal (2 chỗ: dòng 656 và 979)**: Thay cả hai bằng EnhancedDonateModal với props phù hợp
   - Trước: `<DonateModal videoId={id} creatorName={...} channelUserId={...} />`
   - Sau: `<EnhancedDonateModal defaultReceiverId={video?.user_id} defaultReceiverName={video?.channels?.name} defaultReceiverAvatar={video?.channels?.avatar_url} contextType="video" contextId={id} />`
   - Chỉ giữ lại 1 instance (xóa bản trùng lặp)

### Kết quả mong đợi

- Nút "Thưởng & Tặng" dưới video có giao diện vàng gold đồng bộ với nút trên Header và Profile
- Khi bấm mở ra EnhancedDonateModal với đầy đủ tính năng: chọn chủ đề, emoji, nhạc nền, hiệu ứng ăn mừng, Celebration Card
- Thông tin người nhận (tên kênh, avatar) được truyền sẵn vào modal
- Loại bỏ hoàn toàn DonateModal cũ khỏi trang Watch

