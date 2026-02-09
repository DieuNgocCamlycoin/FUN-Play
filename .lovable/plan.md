
# KẾ HOẠCH CHI TIẾT TRIỂN KHAI HỆ THỐNG LỊCH SỬ GIAO DỊCH & LỊCH SỬ VÍ FUN PLAY

## I. TỔNG QUAN HỆ THỐNG

### Mục Tiêu Chính
- Xây dựng hệ thống lịch sử giao dịch **công khai, minh bạch, truy vết được trên blockchain**
- Gắn kết hồ sơ người dùng với địa chỉ ví
- Thống nhất dòng tiền từ tất cả các nguồn (tip, donate, thưởng, claim, giao dịch nội bộ)
- Cung cấp dữ liệu nền tảng cho tính Light Score, Top Sponsor, Ranking

### Phạm Vi Giao Dịch Cần Ghi Nhận
- **Tip người dùng**: Chuyển tiền trực tiếp giữa các người dùng
- **Donate dự án**: Ủng hộ các dự án trên nền tảng
- **Thưởng CAMLY/FUN MONEY**: Reward từ hệ thống
- **Claim token**: Yêu cầu rút thưởng
- **Giao dịch nội bộ**: Chuyển tiền trong ví FUN PLAY
- **Giao dịch onchain**: Giao dịch trên BSC, BTC, vv.

---

## II. CẤU TRÚC DỮ LIỆU (UNIFIED TRANSACTION)

### Các Trường Bắt Buộc
```
id                    : UUID (khóa chính)
sender_user_id        : UUID (người gửi)
sender_display_name   : String (tên hiển thị người gửi)
sender_avatar_url     : URL (ảnh đại diện người gửi)
wallet_from           : String (ví gửi - rút gọn: 0x1234...ABCD)
wallet_from_full      : String (ví gửi - đầy đủ - chỉ xem khi hover)

receiver_user_id      : UUID (người nhận)
receiver_display_name : String (tên hiển thị người nhận)
receiver_avatar_url   : URL (ảnh đại diện người nhận)
wallet_to             : String (ví nhận - rút gọn)
wallet_to_full        : String (ví nhận - đầy đủ - chỉ xem khi hover)

token_symbol          : String (CAMLY, FUN, BNB, USDT, BTC, vv.)
amount                : Decimal (số lượng giao dịch)
transaction_type      : Enum (tip|donate|reward|claim|transfer)
message               : Text (nội dung/ghi chú giao dịch)

is_onchain            : Boolean (giao dịch onchain?)
chain                 : String nullable (BSC|BTC|ETH|...)
tx_hash               : String nullable (mã giao dịch onchain)

status                : Enum (success|pending|failed)
created_at            : DateTime (thời gian tạo)
updated_at            : DateTime (thời gian cập nhật)
```

---

## III. TRANG GIAO DỊCH CÔNG KHAI (`/transactions`)

### 3.1. Cấu Trúc Trang
```
┌─────────────────────────────────────────────────────┐
│  LỊCH SỬ GIAO DỊCH FUN PLAY                         │
│  Minh bạch • Truy vết Blockchain • Chuẩn Web3       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  📊 THỐNG KÊ TỔNG QUAN                              │
│  • Tổng giao dịch: 15.234                           │
│  • Tổng giá trị: 245.678 CAMLY                      │
│  • Giao dịch hôm nay: 124                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🔍 BỘ LỌC & TÌM KIẾM                               │
│  [🔎 Tìm kiếm...] [Token ▼] [Loại ▼] [Thời gian ▼] │
│  [Onchain/Nội bộ ▼] [Trạng thái ▼]                  │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ✨ DANH SÁCH GIAO DỊCH                                          │
│                                                                  │
│  [👤] Nguyễn Văn A        →        [👤] Trần Thị B             │
│  0x1234...5678 [📋] [🔗]          0xABCD...EFGH [📋] [🔗]      │
│                                                                  │
│  ↑ +5.000 CAMLY                                                 │
│  "Ủng hộ nội dung hay"                                           │
│  [✓ Thành công] • 09/02/2026 19:45 • [🔗 BscScan]              │
│  TX: 0xabc123def456... [Sao chép] [Xem explorer]               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                       [Tải thêm...]                              │
└──────────────────────────────────────────────────────────────────┘

[💾 Xuất CSV] [📄 Xuất PDF]
```

### 3.2. Thông Tin Mỗi Giao Dịch
Mỗi card hiển thị:
- **Người gửi**: Avatar + Tên (click → profile)
- **Ví gửi**: 0x1234...5678 (hover → full address)
  - Icon 📋 copy address → Toast xác nhận
  - Icon 🔗 mở explorer (BSCscan, etc.)
- **Mũi tên**: → (chiều giao dịch)
- **Người nhận**: Avatar + Tên (click → profile)
- **Ví nhận**: 0xABCD...EFGH (hover → full address)
  - Icon 📋 copy address
  - Icon 🔗 mở explorer
- **Số lượng**: +5.000 CAMLY (màu xanh/đỏ tùy chiều)
- **Nội dung**: "Ủng hộ nội dung hay"
- **Thông tin**: ✓ Thành công | 09/02/2026 19:45 | [Chain icon]
- **Tx Hash**: 0xabc123... [Sao chép] [Xem BSCscan]

### 3.3. Tính Năng Tương Tác
| Tính năng | Hành động | Kết quả |
|-----------|-----------|---------|
| Click avatar/tên người gửi | Chuyển tới profile | `/user/{user_id}` |
| Click avatar/tên người nhận | Chuyển tới profile | `/user/{user_id}` |
| Hover ví | Hiển thị full address | `0x1234567890ABCDEF...` |
| Click icon 📋 | Sao chép ví | Toast: "Đã sao chép!" |
| Click icon 🔗 (ví) | Mở explorer | https://bscscan.com/address/0x... |
| Click tx_hash | Sao chép tx_hash | Toast: "Đã sao chép!" |
| Click [Xem explorer] | Mở BscScan | https://bscscan.com/tx/0x... |

---

## IV. LỊCH SỬ VÍ CÁ NHÂN (WALLET HISTORY)

### 4.1. Vị Trí Trong Giao Diện
- Hiển thị trong **FUN PLAY WALLET** → Tab "📜 Lịch Sử Giao Dịch"
- Phía dưới `CAMLYPriceSection`, trên `TopSponsorsSection`
- Nâng cấp từ component `TransactionHistorySection.tsx` hiện tại

### 4.2. Dữ Liệu Hiển Thị
Lịch sử ví chỉ hiển thị giao dịch **liên quan** đến user (gửi + nhận + thưởng + claim)

| Cột | Nội dung | Ví dụ |
|-----|----------|--------|
| **Hướng** | Icon ↑ (gửi) / ↓ (nhận) | ↑ / ↓ |
| **Đối tác** | Tên + Avatar (click → profile) | @tranthib [👤] |
| **Ví Từ** | 0x1234...5678 [📋] [🔗] | 0x1234...5678 |
| **Ví Đến** | 0xABCD...EFGH [📋] [🔗] | 0xABCD...EFGH |
| **Token** | CAMLY, BNB, USDT, vv. | CAMLY |
| **Số lượng** | +/- số tiền (màu xanh/đỏ) | +5.000 CAMLY |
| **Nội dung** | Mô tả giao dịch | "Ủng hộ video" |
| **Thời gian** | DD/MM/YYYY HH:MM | 09/02/2026 19:45 |
| **Trạng thái** | ✓ Thành công / ⏳ Chờ xử lý / ✗ Thất bại | ✓ Thành công |
| **Chain** | Icon blockchain (nếu onchain) | [🔗 BSC] |
| **Tx Hash** | 0xabc... [Xem explorer] | [Xem BscScan] |

### 4.3. Quyền Hiển Thị
- **Chủ ví**: Xem chi tiết đầy đủ lịch sử của mình
- **Người khác**: Xem tổng quan (nếu profile công khai)
- **Admin**: Xem tất cả lịch sử

---

## V. BỘ LỌC & TÌM KIẾM

### 5.1. Tính Năng Lọc (Áp Dụng Cho Cả 2 Trang)
```
🔍 TÌM KIẾM (Input):
   • Username người gửi/nhận
   • Ví (0x1234...)
   • Tx Hash (0xabc123...)

📊 TOKEN (Dropdown):
   • Tất cả
   • CAMLY
   • FUN MONEY
   • BNB
   • USDT
   • Khác

🔄 LOẠI GIAO DỊCH (Dropdown):
   • Tất cả
   • Tip
   • Donate
   • Thưởng
   • Claim
   • Chuyển tiền

⏰ THỜI GIAN (Dropdown):
   • Tất cả
   • 7 ngày gần nhất
   • 30 ngày gần nhất
   • Tháng này
   • Khoảng tùy chọn (từ - đến)

🌐 LOẠI GIAO DỊCH (Checkbox group):
   ☐ Onchain
   ☐ Nội bộ

📈 TRẠNG THÁI (Dropdown):
   • Tất cả
   • Thành công
   • Chờ xử lý
   • Thất bại
```

### 5.2. Cách Hoạt Động
- Lọc áp dụng **real-time** (không cần nhấp nút)
- Kết hợp nhiều bộ lọc (AND logic)
- Hiển thị "X kết quả phù hợp / Y tổng cộng"

---

## VI. XUẤT DỮ LIỆU (CSV & PDF)

### 6.1. Nut Xuất
Hai nút trong header mỗi trang:
- **[💾 Xuất CSV]** - Xuất file `.csv`
- **[📄 Xuất PDF]** - Xuất file `.pdf`

### 6.2. Nội Dung Xuất (Cột)
1. Thời gian (`DD/MM/YYYY HH:MM`)
2. Người gửi (username)
3. Ví gửi (đầy đủ: 0x...)
4. Người nhận (username)
5. Ví nhận (đầy đủ: 0x...)
6. Token (CAMLY, BNB, vv.)
7. Số lượng
8. Nội dung giao dịch
9. Tx Hash
10. Link blockchain (https://bscscan.com/tx/...)
11. Trạng thái (Thành công/Chờ/Thất bại)
12. Loại giao dịch (Tip/Donate/Reward/...)

### 6.3. Format File
**CSV**:
```
Thời gian,Người gửi,Ví gửi,Người nhận,Ví nhận,Token,Số lượng,...
09/02/2026 19:45,nguyen_van_a,0x1234...,tran_thi_b,0xABCD...,CAMLY,5000,...
```

**PDF**:
- Tiêu đề: "LỊCH SỬ GIAO DỊCH FUN PLAY"
- Ngày xuất
- Bảng hiển thị các cột trên
- Footer: "Xuất từ FUN PLAY • Blockchain Transparent • Web3 Standard"

---

## VII. THIẾT KẾ UI/UX

### 7.1. Giao Diện Chung
- **Background**: Gradient sáng (từ primary/5% đến accent/5%)
- **Card**: Glassmorphism (bg-white/90, backdrop-blur-xl, border white/20)
- **Bo góc**: `rounded-lg` (8px)
- **Font**: Segoe UI / System font, dễ đọc
- **Spacing**: Padding 4px, gap 3-4px

### 7.2. Mục Đích Thiết Kế
- ✅ Dễ quét (scan) - người dùng nhanh chóng thấy được dòng tiền
- ✅ Dễ tương tác - copy, click, hover mượt mà
- ✅ Dễ hiểu - icon, màu sắc, layout rõ ràng
- ✅ Responsive - desktop & mobile giống nhau
- ✅ Không lag - lazy loading, pagination/infinite scroll

### 7.3. Responsive Design
| Thiết bị | Layout | Font | Notes |
|---------|--------|------|-------|
| Desktop (≥1024px) | 1 column card | 14px | Full info |
| Tablet (768-1023px) | 1 column card | 13px | Rút gọn ví |
| Mobile (≤767px) | 1 column card | 12px | Stack chiều dọc |

---

## VIII. CÁC THÀNH PHẦN CẦN XÂY DỰNG

### 8.1. Tệp Mới Cần Tạo
| Tệp | Mô tả | Trách nhiệm |
|-----|--------|-----------|
| `src/pages/Transactions.tsx` | Trang giao dịch công khai | Hiển thị danh sách giao dịch, bộ lọc, xuất |
| `src/hooks/useTransactionHistory.ts` | Custom hook | Fetch & normalize dữ liệu từ 3 bảng |
| `src/components/Transactions/TransactionCard.tsx` | Card giao dịch | Render 1 giao dịch với đầy đủ thông tin |
| `src/components/Transactions/WalletAddressDisplay.tsx` | Hiển thị ví | 0x1234...5678 + copy + explorer |
| `src/components/Transactions/TransactionFilters.tsx` | Bộ lọc | Token, loại, thời gian, tìm kiếm |
| `src/components/Transactions/TransactionExport.tsx` | Xuất dữ liệu | CSV/PDF export |
| `src/components/Transactions/index.ts` | Barrel export | Export tất cả component |

### 8.2. Tệp Cần Sửa
| Tệp | Thay đổi |
|-----|----------|
| `src/components/Wallet/TransactionHistorySection.tsx` | Thêm ví, message, blockchain link, xuất |
| `src/App.tsx` | Thêm route `/transactions` |

---

## IX. BỐ CỤC ROUTING

### 9.1. Route Mới
```typescript
// src/App.tsx
<Route path="/transactions" element={<Transactions />} />
```

### 9.2. Route Liên Quan
```
/wallet              → Ví cá nhân (lịch sử ví)
/transactions        → Giao dịch công khai
/user/{userId}       → Profile người dùng
```

---

## X. BẢO MẬT & RLS (ROW LEVEL SECURITY)

### 10.1. Nguyên Tắc
- ✅ Chỉ hiển thị **public wallet address** (address từ blockchain)
- ❌ **TUYỆT ĐỐI KHÔNG** lưu hoặc hiển thị private key
- ✅ RLS kiểm soát quyền truy cập dữ liệu

### 10.2. RLS Policies
| Bảng | Chính sách | Ai được truy cập |
|------|-----------|-----------------|
| `donation_transactions` | Public SELECT | Mọi người xem được |
| `reward_transactions` | Chủ ví xem được, admin xem tất cả | User xem của mình |
| `wallet_transactions` | User xem của mình | User xem của mình |

### 10.3. Data Privacy
- Giao dịch công khai: Người dùng ID, tên, avatar, ví (address)
- Chi tiết riêng tư: Email, phone, password hash (NEVER show)

---

## XI. KHI NÀO TRIỂN KHAI?

### Giai Đoạn 1 (Ngay): Backend & Hook
- Tạo `useTransactionHistory.ts` (normalize dữ liệu từ 3 bảng)

### Giai Đoạn 2 (Sau): Components Dùng Chung
- `TransactionCard.tsx`, `WalletAddressDisplay.tsx`, `TransactionFilters.tsx`, `TransactionExport.tsx`

### Giai Đoạn 3 (Cuối): Trang & Tích Hợp
- Tạo `/transactions` trang công khai
- Nâng cấp `TransactionHistorySection.tsx` trong ví cá nhân
- Thêm route vào `App.tsx`

---

## XII. GIẢI PHÁP CÓ THỂ GẶP PHẢI

### Vấn Đề 1: Dữ Liệu Người Dùng Cũ
**Vấn đề**: Sender/receiver names có thể đã thay đổi, nhưng transaction cũ lưu giá trị cũ

**Giải pháp**: Join với `profiles` table real-time để lấy tên/avatar mới nhất

### Vấn Đề 2: Quá Nhiều Giao Dịch (Performance)
**Vấn Đề**: Trang công khai có thể hàng chục ngàn giao dịch, load slow

**Giải pháp**: 
- Sử dụng **Infinite Scroll** hoặc **Pagination** (20-50 giao dịch/lần)
- Database indexing trên `created_at`, `status`
- Caching tên/avatar người dùng

### Vấn Đề 3: Giao Dịch Onchain vs Nội Bộ
**Vấn Đề**: Dữ liệu từ nhiều bảng khác nhau, cấu trúc không giống nhau

**Giải pháp**: Hook `useTransactionHistory` normalize tất cả vào `UnifiedTransaction` interface

---

## XIII. GIẢI PHÁP CÓ THỂ GẶP PHẢI (Tiếp)

### Vấn Đề 4: Mobile vs Desktop
**Vấn Đề**: Ví rất dài, layout card có thể rối trên mobile

**Giải pháp**: 
- Desktop: Hiển thị full info
- Mobile: Rút gọn ví (0x1234...5678), ẩn bớt icon, stack chiều dọc

### Vấn Đề 5: Copy Wallet Address UX
**Vấn Đề**: Người dùng không rõ ví nào là "from", ví nào là "to"

**Giải pháp**: Rõ ràng với label "Từ ví", "Đến ví", hoặc icon mũi tên

---

## XIV. KÌ VỌNG CUỐI CÙNG

Sau triển khai, FUN PLAY sẽ trở thành:

✅ **Nền tảng minh bạch**: Mỗi giao dịch có thể được kiểm chứng
✅ **Blockchain-ready**: Liên kết với explorer, tx_hash, wallet address
✅ **Trust system**: Giao dịch là nền tảng tính Light Score, Top Sponsor
✅ **Audit-friendly**: Export CSV/PDF để kiểm tra bất kỳ lúc nào
✅ **Web3 compliant**: Gắn chặt ví, token, blockchain

**Giá trị cuối cùng**: FUN PLAY không chỉ là nền tảng video, mà là **hệ sinh thái tài chính minh bạch** dựa trên blockchain.
