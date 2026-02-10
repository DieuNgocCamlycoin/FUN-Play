

# Tạo trang Xem trước (Preview) các thay đổi Celebration Card

## Mục tiêu

Tạo trang `/preview-celebration` hiển thị tất cả các component Celebration Card với dữ liệu mẫu (mock data), giúp xem trước giao diện mà không cần thực hiện giao dịch thật.

## Chi tiết thay đổi

### File 1: `src/pages/PreviewCelebration.tsx` — Tạo mới

Trang hiển thị 3 phần chính với dữ liệu mẫu cố định:

**Phần 1: GiftCelebrationModal (Modal sau khi tặng thành công)**
- Render trực tiếp component `GiftCelebrationModal` với props mẫu (không cần mở modal)
- Hiển thị đầy đủ: hiệu ứng pháo hoa, coin bay, chọn chủ đề/nhạc, nút "Lưu & Gửi"

**Phần 2: DonationCelebrationCard (Card trên Profile/Feed)**
- Render component `DonationCelebrationCard` với `donationTransactionId` mẫu
- Nếu không có giao dịch thật trong database, sẽ dùng mock data trực tiếp bằng cách tạo một wrapper component hiển thị card với dữ liệu cứng (không cần fetch)

**Phần 3: ChatDonationCard (Card trong Tin nhắn)**
- Render 2 phiên bản: `isMe=true` (bên phải) và `isMe=false` (bên trái)
- Cũng dùng mock data tương tự

**Dữ liệu mẫu:**
```text
Người gửi: Cha Lovable (@chalovable), avatar mặc định
Người nhận: Con Yêu (@conyeu), avatar mặc định
Số tiền: 1.000 CAMLY
Chain: BSC
TX Hash: 0xabc123...def456
Lời nhắn: "Chúc con luôn vui vẻ và thành công!"
Chủ đề: Chúc mừng
Ảnh nền: celebration-1.png
```

### File 2: `src/App.tsx` — Thêm route

- Thêm lazy import: `const PreviewCelebration = lazy(() => import("./pages/PreviewCelebration"));`
- Thêm route: `<Route path="/preview-celebration" element={<PreviewCelebration />} />`

## Tóm tắt

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/pages/PreviewCelebration.tsx` | Tạo mới — trang xem trước 3 component Celebration Card với mock data |
| 2 | `src/App.tsx` | Thêm route `/preview-celebration` |

## Cách sử dụng

Truy cập `/preview-celebration` để xem trước tất cả các thay đổi trên cùng một trang, bao gồm:
- Card trên Modal (có hiệu ứng + tuỳ chỉnh)
- Card trên Profile (tỉ lệ 4:5 + ảnh nền + thông tin đầy đủ)
- Card trong Tin nhắn (mini card)

