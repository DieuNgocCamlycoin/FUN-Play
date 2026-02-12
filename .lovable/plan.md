
# Sửa lỗi thiếu giao dịch USDT Ví 2 và hiển thị sai

## Nguyên nhân gốc

Cả hai edge function `backfill-moralis` và `sync-transactions-cron` chỉ đồng bộ token CAMLY (contract `0x0910...e413`). Giao dịch USDT (contract `0x55d3...9553`) từ Ví 2 trên blockchain **chưa bao giờ được import** vào database.

Theo ảnh BscScan, Ví 2 có 12 giao dịch USDT tổng cộng (bao gồm cả gửi đi và nhận vào). Các giao dịch gửi đi (OUT) bao gồm: 100 + 50 + 50 + 50 + 50 + 50 + 50 = **400 USDT**.

## Kế hoạch sửa

### Bước 1: Cập nhật `backfill-moralis` -- hỗ trợ cả USDT

**File:** `supabase/functions/backfill-moralis/index.ts`

- Thêm constant USDT token contract: `0x55d398326f99059fF775485246999027B3197955`
- Gọi Moralis API 2 lần cho mỗi ví: 1 lần cho CAMLY, 1 lần cho USDT
- Khi insert giao dịch USDT, set `token_type = "USDT"` và `token_contract` đúng
- Giữ nguyên logic cũ cho CAMLY, chỉ bổ sung thêm luồng USDT

### Bước 2: Cập nhật `sync-transactions-cron` -- đồng bộ USDT định kỳ

**File:** `supabase/functions/sync-transactions-cron/index.ts`

- Tương tự backfill, thêm luồng đồng bộ USDT cho mỗi ví hệ thống
- Lưu sync cursor riêng cho USDT (khác token_contract)

### Bước 3: Sửa `RewardPoolTab.tsx` -- hiển thị chính xác

**File:** `src/components/Admin/tabs/RewardPoolTab.tsx`

- Luôn hiển thị dòng USDT cho Ví 2 (kể cả khi = 0, chờ sync)
- Sửa profile lookup: ưu tiên profile có avatar khi trùng wallet address
- Lọc bảng giao dịch theo mốc cutoff đồng bộ với thẻ tổng

### Bước 4: Deploy và chạy backfill USDT

1. Deploy `backfill-moralis` mới
2. Gọi backfill cho Ví 2 (USDT sẽ tự động được sync)
3. Kiểm tra database: xác nhận giao dịch USDT Ví 2 đã có
4. Kiểm tra giao diện: tổng USDT Ví 2 hiển thị đúng

---

## Chi tiết kỹ thuật

### Thay đổi chính trong `backfill-moralis`:

```text
const USDT_TOKEN = "0x55d398326f99059fF775485246999027B3197955";

// Fetch cho mỗi ví: CAMLY transfers + USDT transfers
const camlyTransfers = await fetchAllTransfers(wallet, apiKey, fromBlock, CAMLY_TOKEN);
const usdtTransfers = await fetchAllTransfers(wallet, apiKey, fromBlock, USDT_TOKEN);

// Insert USDT với token_type = "USDT", token_contract = USDT_TOKEN
```

### Thay đổi trong `RewardPoolTab.tsx`:

- Bỏ điều kiện `manualStats.wallet2Usdt > 0` -- luôn hiển thị USDT
- Profile Map: ưu tiên profile có avatar_url khi trùng wallet

### Files cần sửa (3 files):
1. `supabase/functions/backfill-moralis/index.ts`
2. `supabase/functions/sync-transactions-cron/index.ts`
3. `src/components/Admin/tabs/RewardPoolTab.tsx`
