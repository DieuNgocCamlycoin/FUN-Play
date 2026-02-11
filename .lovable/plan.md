

# Nâng cấp chuyển đồng FUN Money & Sửa lỗi Light Score

---

## Phần 1: Cho phép chuyển FUN Money như CAMLY, USDT, BNB

### Nguyên nhân hiện tại

Đồng FUN Money trong bảng `donate_tokens` được cấu hình là `chain: "internal"`, khiến hệ thống đọc số dư từ bảng `internal_wallets` (hiện trống). Trong thực tế, FUN Money là token on-chain trên BSC với contract address `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`.

### Giải pháp

Chuyển FUN Money từ `chain: "internal"` sang `chain: "bsc"` để nó hoạt động giống CAMLY, USDT, BNB — đọc số dư trực tiếp từ ví BSC của người dùng.

### Chi tiết thay đổi

**1. Cập nhật dữ liệu trong bảng `donate_tokens` (Database)**

Cập nhật bản ghi FUN Money:
- `chain`: `"internal"` → `"bsc"`
- `contract_address`: thêm `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`
- `decimals`: `0` → `18` (FUN Money dùng 18 decimals theo contract)

**2. Thêm FUN vào danh sách token BSC (Frontend)**

Tệp: `src/config/tokens.ts`
- Thêm FUN Money vào mảng `SUPPORTED_TOKENS` với contract address và 18 decimals
- Điều này cho phép `EnhancedDonateModal` tự động kiểm tra số dư FUN trên ví BSC

**3. Cập nhật Edge Function `create-donation/index.ts`**

- Xoá toàn bộ logic `internal_wallets` (dòng 115-182) vì FUN không còn là token nội bộ
- Khi FUN là `chain: "bsc"`, nó sẽ đi theo luồng BSC giống CAMLY/USDT — tạo giao dịch pending, người dùng ký trên ví, rồi xác nhận

**4. Cập nhật `useInternalWallet.ts` (Frontend)**

- Hook này sẽ không còn tìm thấy token internal nào nếu FUN chuyển sang BSC — cần xử lý trường hợp danh sách trống để không bị lỗi

---

## Phần 2: Sửa lỗi tính điểm Light Score

### Nguyên nhân lỗi

Hàm RPC `get_user_activity_summary` đếm uploads sai:

```sql
-- Hiện tại (SAI): Chỉ đếm reward_type = 'UPLOAD'
'uploads', COUNT(*) FILTER (WHERE reward_type = 'UPLOAD')
-- Kết quả: 43 uploads (bỏ sót 94 bản ghi)

-- Thực tế: Hệ thống dùng 3 loại reward_type cho upload:
-- 'UPLOAD' (43 bản ghi)
-- 'SHORT_VIDEO_UPLOAD' (53 bản ghi)  
-- 'LONG_VIDEO_UPLOAD' (41 bản ghi)
-- 'FIRST_UPLOAD' (28 bản ghi)
```

Hậu quả: Trụ cột **S (Service)** bị tính thấp hơn thực tế vì uploads bị đếm thiếu → Light Score bị giảm → Người dùng không đủ điểm để mint.

### Giải pháp

**Cập nhật hàm RPC `get_user_activity_summary` (Database Migration)**

Sửa bộ lọc uploads để đếm tất cả các loại upload:

```sql
'uploads', COUNT(*) FILTER (WHERE reward_type IN ('UPLOAD', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD', 'FIRST_UPLOAD'))
```

---

## Tóm tắt tệp cần thay đổi

| # | Loại | Tệp / Vị trí | Thay đổi |
|---|------|---------------|----------|
| 1 | Database (dữ liệu) | Bảng `donate_tokens` | Cập nhật FUN: chain → bsc, thêm contract_address, decimals → 18 |
| 2 | Database (migration) | Hàm RPC `get_user_activity_summary` | Sửa bộ lọc uploads để đếm đủ các loại |
| 3 | Frontend | `src/config/tokens.ts` | Thêm FUN Money vào SUPPORTED_TOKENS |
| 4 | Edge Function | `supabase/functions/create-donation/index.ts` | Xoá logic internal_wallets, FUN đi theo luồng BSC |
| 5 | Frontend | `src/hooks/useInternalWallet.ts` | Xử lý trường hợp không còn token internal |

---

## Kết quả mong đợi

**Chuyển FUN:**
- Người dùng có FUN trong ví BSC sẽ thấy số dư thật trong modal "Thưởng & Tặng"
- Chuyển FUN hoạt động giống CAMLY, USDT, BNB — ký giao dịch trên ví, xác nhận on-chain
- Không cần admin nạp thủ công — đọc trực tiếp từ blockchain

**Light Score:**
- Điểm uploads được tính đúng (bao gồm SHORT_VIDEO_UPLOAD, LONG_VIDEO_UPLOAD, FIRST_UPLOAD)
- Trụ cột S (Service) tăng → Light Score tăng → Nhiều người dùng đủ điểm để mint FUN Money

