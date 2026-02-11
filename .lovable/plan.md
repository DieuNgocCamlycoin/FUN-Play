
# Sửa lỗi: Không gửi được FUN trong Thưởng & Quà Tặng

## Nguyên nhân

Dữ liệu cho thấy các giao dịch FUN được tạo thành công (status: "pending") nhưng **không bao giờ hoàn tất** vì bước chuyển on-chain thất bại.

Cụ thể: Khi gửi FUN, hệ thống gọi `switchChain(wagmiConfig, { chainId: 97 })` để chuyển ví sang BSC Testnet. Trên mobile (WalletConnect), hầu hết các ví không có sẵn BSC Testnet nên `switchChain` thất bại -> giao dịch bị huỷ -> status mãi ở "pending".

Ngoài ra, edge function `confirm-bsc-donation` dùng sai explorer URL cho FUN (dùng mainnet thay vì testnet).

## Giải pháp

### 1. Tự động thêm BSC Testnet vào ví trước khi chuyển mạng

**Tệp:** `src/lib/donation.ts`

Khi `switchChain` thất bại, thử thêm mạng BSC Testnet vào ví bằng `wallet_addEthereumChain` rồi thử lại. Nếu vẫn thất bại trên mobile (WalletConnect không hỗ trợ addChain), sử dụng fallback: tạo provider trực tiếp từ private key hoặc hiển thị hướng dẫn chi tiết cho người dùng.

Cách tiếp cận thực tế hơn: Sử dụng wagmi `switchChain` kết hợp với `addChain` từ `@wagmi/core` để thêm BSC Testnet nếu chưa có.

```text
// Luồng xử lý mới:
1. Thử switchChain(97)
2. Nếu thất bại -> thử addChain(bscTestnet) rồi switchChain lại
3. Nếu vẫn thất bại -> hiện thông báo rõ ràng hướng dẫn thêm BSC Testnet thủ công
4. Re-fetch walletClient sau khi chuyển mạng thành công
```

### 2. Sửa explorer URL cho FUN (testnet)

**Tệp:** `supabase/functions/confirm-bsc-donation/index.ts`

Kiểm tra token chain: nếu token là FUN (BSC Testnet), sử dụng `https://testnet.bscscan.com/tx/` thay vì `https://bscscan.com/tx/`.

```text
// Lấy token info để xác định explorer URL đúng
const tokenData = await supabase.from("donate_tokens")...
const isFunTestnet = tokenData.contract_address === "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2";
const explorerUrl = isFunTestnet 
  ? `https://testnet.bscscan.com/tx/${tx_hash}`
  : `https://bscscan.com/tx/${tx_hash}`;
```

### 3. Dọn dẹp giao dịch "pending" bị kẹt

Các giao dịch FUN cũ đang ở trạng thái "pending" sẽ không bao giờ được hoàn tất. Cần cập nhật status thành "failed" để không gây nhầm lẫn:

```text
UPDATE donation_transactions 
SET status = 'failed' 
WHERE token_id = 'a96baf29-db80-43ed-b5f1-7ac9f203bb88' 
  AND status = 'pending' 
  AND tx_hash IS NULL;
```

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/lib/donation.ts` | Thêm logic addChain BSC Testnet trước switchChain, cải thiện error handling |
| 2 | `supabase/functions/confirm-bsc-donation/index.ts` | Sửa explorer URL cho FUN Testnet |
| 3 | Database | Cập nhật giao dịch pending bị kẹt thành failed |
