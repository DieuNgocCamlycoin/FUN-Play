
# Sửa lỗi "Transfer amount exceeds balance" — Kiểm tra số dư BSC trước khi gửi

---

## Nguyên nhân lỗi

Lỗi **"BEP20: transfer amount exceeds balance"** nghĩa là ví của con **không có đủ 5 USDT** trên mạng BSC để gửi. Hiện tại hệ thống chỉ kiểm tra số dư cho token **nội bộ** (Fun Money), còn token BSC (USDT, CAMLY, BNB) thì **bỏ qua kiểm tra** — luôn cho phép bấm "Xác nhận & Tặng" rồi mới báo lỗi khó hiểu từ blockchain.

**Dòng gây lỗi** (dòng 306-308 trong `EnhancedDonateModal.tsx`):
```typescript
const isValidAmount = selectedToken?.chain === "internal"
  ? currentBalance !== null && parseFloat(amount) <= currentBalance
  : true;  // <-- Luôn true cho BSC, không kiểm tra số dư
```

---

## Giải pháp

Thêm kiểm tra số dư on-chain (BSC) **trước khi cho phép chuyển sang bước xác nhận**, hiển thị cảnh báo rõ ràng bằng tiếng Việt khi không đủ số dư.

---

## Chi tiết thay đổi

### Tệp: `src/components/Donate/EnhancedDonateModal.tsx`

**1. Thêm state lưu số dư BSC:**
- Thêm `bscBalance` (string) và `loadingBscBalance` (boolean)
- Thêm import `ethers` và `SUPPORTED_TOKENS` từ `@/config/tokens`

**2. Thêm useEffect kiểm tra số dư BSC:**
- Khi người dùng chọn token BSC và đã kết nối ví (qua `window.ethereum`):
  - Token native (BNB): Lấy số dư bằng `provider.getBalance()`
  - Token ERC-20 (USDT, CAMLY): Lấy số dư bằng `contract.balanceOf()`
- Nếu chưa kết nối ví: Hiện thông báo "Kết nối ví để kiểm tra số dư"

**3. Cập nhật logic `isValidAmount`:**
```typescript
const isValidAmount = selectedToken?.chain === "internal"
  ? currentBalance !== null && parseFloat(amount || "0") <= currentBalance
  : bscBalance !== null && parseFloat(amount || "0") <= parseFloat(bscBalance);
```

**4. Hiển thị số dư BSC trong giao diện:**
- Thêm dòng hiển thị: "Số dư ví: X.XX TOKEN" dưới ô chọn token BSC
- Khi số dư không đủ: Hiển thị cảnh báo đỏ "Số dư không đủ. Ví của bạn chỉ có X.XX TOKEN"
- Nút "Xem lại & Xác nhận" sẽ bị vô hiệu hóa khi số dư không đủ (nhờ `canProceedToReview` dùng `isValidAmount`)

**5. Cải thiện thông báo lỗi trong `useDonation.ts`:**
- Bắt lỗi "exceeds balance" từ blockchain và hiển thị tiếng Việt: "Số dư token trong ví không đủ để thực hiện giao dịch này"

---

## Tóm tắt tệp cần thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Donate/EnhancedDonateModal.tsx` | Thêm kiểm tra số dư BSC, hiển thị cảnh báo, vô hiệu hóa nút khi không đủ |
| 2 | `src/hooks/useDonation.ts` | Cải thiện thông báo lỗi blockchain sang tiếng Việt |

---

## Kết quả mong đợi

- Người dùng sẽ **thấy số dư ví BSC** ngay trong form tặng
- Nếu số dư không đủ, nút "Xem lại & Xác nhận" sẽ **bị vô hiệu hóa** và hiện cảnh báo rõ ràng
- Không còn gặp lỗi blockchain khó hiểu nữa
