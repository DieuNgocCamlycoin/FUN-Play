
# Sửa Celebration Card — Tăng cỡ chữ, bố cục đúng 4:5, sửa lưu ảnh thiếu avatar

## Vấn đề hiện tại (từ ảnh chụp màn hình)

1. **Chữ quá nhỏ**: Toàn bộ text dùng `text-[9px]`, `text-[10px]`, `text-[11px]` — rất khó đọc
2. **Bố cục 1:9:1**: Phần avatar + tên chiếm rất ít (~10%), phần chi tiết giao dịch chiếm ~80%, phần dưới (ảnh nền trống) chiếm ~10% — nội dung dồn hết lên trên, phần dưới card bị trống
3. **Tiêu đề nằm NGOÀI card**: Dòng "CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG" nằm trên header modal, không nằm bên trong ảnh nền card
4. **Lưu ảnh mất avatar**: `html2canvas` không render được avatar từ URL ngoài do CORS — ảnh lưu về máy thiếu avatar
5. **Bài đăng Profile**: Hiện chỉ hiển thị text thuần, không hiển thị Celebration Card đồ hoạ (hình cuối cùng)
6. **Tin nhắn Messenger**: Chỉ hiện text + nút "Xem biên nhận", không hiện card đồ hoạ

## Chi tiết thay đổi

### File 1: `src/components/Donate/GiftCelebrationModal.tsx`

**A. Đưa tiêu đề vào TRONG card (bên trong `cardRef`):**
- Di chuyển dòng "🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉" từ header modal vào bên trong div có `ref={cardRef}` (dòng 390-401)
- Đặt làm phần tử đầu tiên trong card, phía trên avatar

**B. Tăng cỡ chữ toàn bộ card:**

| Phần tử | Cũ | Mới |
|---|---|---|
| Tiêu đề "CHÚC MỪNG..." | `text-sm` (ngoài card) | `text-sm font-bold` (trong card) |
| Tên người gửi/nhận | `text-[11px]` | `text-sm` |
| Username @... | `text-[9px]` | `text-xs` |
| Địa chỉ ví | `text-[9px]` | `text-[11px]` |
| Số tiền | `text-base` | `text-xl` |
| Token symbol | `text-[10px]` | `text-sm` |
| Chi tiết (Trạng thái, Chain...) | `text-[11px]` | `text-sm` |
| Lời nhắn | `text-[11px]` | `text-sm` |
| Mã biên nhận | `text-[11px]` | `text-xs` |
| Avatar | `h-10 w-10` | `h-12 w-12` |
| Nút Copy | `h-3 w-3` | `h-3.5 w-3.5` |

**C. Bố cục card đúng 4:5 — phân bổ đều nội dung:**
- Sử dụng `flex flex-col justify-between h-full` cho container nội dung bên trong card
- Chia 3 phần cân đối:
  - Phần trên: Tiêu đề + Avatar đôi bên + Số tiền (~35%)
  - Phần giữa: Chi tiết giao dịch (trạng thái, chủ đề, lời nhắn, thời gian, chain, TX hash, mã biên nhận) (~50%)
  - Phần dưới: Nút "Xem biên nhận" (~15%)
- Tăng padding từ `p-3` lên `p-5`

**D. Sửa lưu ảnh — đảm bảo có avatar:**
- Thay đổi hàm `handleSaveImage`: trước khi gọi `html2canvas`, chuyển đổi các thẻ `<img>` avatar thành base64 bằng cách vẽ chúng qua canvas proxy
- Hoặc dùng phương pháp đơn giản hơn: thêm option `allowTaint: true` và `useCORS: true` cho `html2canvas`, đồng thời preload avatar images qua fetch → blob → objectURL trước khi capture
- Cụ thể: tạo hàm `preloadImages()` convert tất cả `<img>` bên trong `cardRef` sang data URL trước khi chụp, sau đó khôi phục lại src gốc

### File 2: `src/components/Profile/DonationCelebrationCard.tsx`

**Tăng cỡ chữ tương tự GiftCelebrationModal:**

| Phần tử | Cũ | Mới |
|---|---|---|
| Tiêu đề | `text-xs` | `text-sm font-bold` |
| Tên người | `text-[11px]` | `text-sm` |
| Username | `text-[9px]` | `text-xs` |
| Ví | `text-[8px]` | `text-[11px]` |
| Số tiền | `text-base` | `text-xl` |
| Token | `text-[10px]` | `text-sm` |
| Chi tiết | `text-[10px]` | `text-sm` |
| Lời nhắn | `text-[10px]` | `text-sm` |
| Avatar | `h-10 w-10` | `h-12 w-12` |
| Copy icon | `h-2.5 w-2.5` | `h-3.5 w-3.5` |

**Bố cục `justify-between` cho nội dung phân bổ đều trong khung 4:5.**

### File 3: `src/components/Chat/ChatDonationCard.tsx`

**Tăng cỡ chữ mini card trong chat:**

| Phần tử | Cũ | Mới |
|---|---|---|
| Tiêu đề | `text-[9px]` | `text-xs font-bold` |
| Số tiền | `text-sm` | `text-base` |
| Token | `text-[9px]` | `text-xs` |
| Tên người | `text-[10px]` | `text-xs` |
| Avatar | `h-8 w-8` | `h-10 w-10` |

## Tóm tắt thay đổi

| # | File | Thay đổi |
|---|------|----------|
| 1 | `GiftCelebrationModal.tsx` | Đưa tiêu đề vào trong card; tăng cỡ chữ + avatar; bố cục justify-between; sửa lưu ảnh có avatar |
| 2 | `DonationCelebrationCard.tsx` | Tăng cỡ chữ + avatar; bố cục justify-between |
| 3 | `ChatDonationCard.tsx` | Tăng cỡ chữ + avatar mini card |

## Kết quả mong đợi

- Celebration Card hiển thị chữ rõ ràng, dễ đọc trên laptop và mobile
- Nội dung phân bổ đều trong khung 4:5, không bị dồn lên trên + trống phía dưới
- Tiêu đề "CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG" nằm bên trong ảnh nền card
- Lưu ảnh về máy có đầy đủ avatar, background, và toàn bộ nội dung
