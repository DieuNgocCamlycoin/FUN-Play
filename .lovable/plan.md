
# KẾ HOẠCH CHUYỂN ĐỔI TỪ BSCSCAN SANG MORALIS CHO BACKFILL GIAO DỊCH ONCHAIN

---

## I. PHÂN TÍCH HIỆN TRẠNG

### Vấn đề
- **BscScan API** đang lỗi/NOTOK → backfill thiếu dữ liệu
- Hiện tại bảng `wallet_transactions` chỉ có **97 giao dịch** với tổng **~6.9M CAMLY**
- Thực tế hệ thống đã chuyển **> 60M CAMLY** → **thiếu rất nhiều giao dịch**
- BscScan API có giới hạn pagination (10,000 records max), không có cursor

### Giải pháp: Moralis API
- Hỗ trợ **cursor pagination** để lấy toàn bộ lịch sử
- Endpoint: `getWalletTokenTransfers` cho ERC20/BEP20
- Có field `log_index` (transaction_index) để tránh miss multi-log events
- API ổn định hơn với rate limit cao hơn

---

## II. TỔNG QUAN THAY ĐỔI

| # | Thành phần | Loại | Mô tả |
|---|------------|------|-------|
| 1 | Secret `MORALIS_API_KEY` | **Thêm mới** | API key từ Moralis Dashboard |
| 2 | Bảng `wallet_transactions` | **Cập nhật schema** | Thêm `chain_id`, `token_contract`, `log_index`, `block_number`, `block_timestamp` |
| 3 | Bảng `sync_cursors` | **Tạo mới** | Lưu cursor/last_block cho incremental sync |
| 4 | Edge Function `backfill-moralis` | **Tạo mới** | Thay thế `backfill-blockchain-history` |
| 5 | Edge Function `sync-transactions-cron` | **Tạo mới** | Đồng bộ incremental mỗi 1-5 phút |
| 6 | Hook `useTransactionHistory` | **Cập nhật nhỏ** | Query từ wallet_transactions với schema mới |
| 7 | Components UI | **Không đổi** | Đã hoàn chỉnh |

---

## III. CHI TIẾT TRIỂN KHAI

### PHASE 1: Cấu hình Secret

**Thêm Secret mới:**
```
MORALIS_API_KEY = <lấy từ https://admin.moralis.io>
```

**Constants cần nhớ:**
```typescript
// Token CAMLY (BEP20)
CAMLY_TOKEN_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413"
CHAIN_ID = 56 (BSC Mainnet)

// 2 Ví hệ thống cần backfill
SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8", // FUN PLAY TẶNG & THƯỞNG
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998", // FUN PLAY TREASURY
]
```

---

### PHASE 2: Cập nhật Database Schema

**Migration cho bảng `wallet_transactions`:**
```sql
-- Thêm các cột mới để lưu đầy đủ thông tin onchain
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS chain_id INTEGER DEFAULT 56,
ADD COLUMN IF NOT EXISTS token_contract TEXT DEFAULT '0x0910320181889fefde0bb1ca63962b0a8882e413',
ADD COLUMN IF NOT EXISTS log_index INTEGER,
ADD COLUMN IF NOT EXISTS block_number BIGINT,
ADD COLUMN IF NOT EXISTS block_timestamp TIMESTAMPTZ;

-- UNIQUE constraint để tránh duplicate multi-log
-- Một tx_hash có thể có nhiều Transfer events (log_index khác nhau)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_event 
ON wallet_transactions(chain_id, token_contract, tx_hash, COALESCE(log_index, 0));

-- Index cho query performance
CREATE INDEX IF NOT EXISTS idx_wallet_tx_from ON wallet_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_to ON wallet_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_block ON wallet_transactions(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_timestamp ON wallet_transactions(block_timestamp DESC);
```

**Tạo bảng `sync_cursors` cho incremental sync:**
```sql
CREATE TABLE IF NOT EXISTS sync_cursors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER DEFAULT 56,
  token_contract TEXT NOT NULL,
  last_cursor TEXT,
  last_block_number BIGINT DEFAULT 0,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  total_synced INTEGER DEFAULT 0,
  UNIQUE(wallet_address, chain_id, token_contract)
);

-- RLS: Chỉ admin được xem/sửa
ALTER TABLE sync_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage sync_cursors" ON sync_cursors
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

### PHASE 3: Edge Function `backfill-moralis`

**File: `supabase/functions/backfill-moralis/index.ts`**

```typescript
// Cấu trúc chính
const corsHeaders = { ... };

// Constants
const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const MORALIS_API_URL = "https://deep-index.moralis.io/api/v2.2";
const SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8",
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998"
];

// Interface response từ Moralis
interface MoralisTokenTransfer {
  transaction_hash: string;
  log_index: string;
  from_address: string;
  to_address: string;
  value: string;
  block_number: string;
  block_timestamp: string;
  token_symbol: string;
  token_decimals: string;
}

// Hàm lấy transfers với pagination
async function fetchAllTransfers(
  wallet: string, 
  apiKey: string,
  fromBlock?: number
): Promise<MoralisTokenTransfer[]> {
  const allTransfers: MoralisTokenTransfer[] = [];
  let cursor: string | null = null;
  
  do {
    const params = new URLSearchParams({
      chain: "bsc",
      contract_addresses: CAMLY_TOKEN,
      limit: "100",
      order: "ASC",
    });
    if (cursor) params.append("cursor", cursor);
    if (fromBlock) params.append("from_block", fromBlock.toString());
    
    const url = `${MORALIS_API_URL}/${wallet}/erc20/transfers?${params}`;
    
    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });
    
    const data = await response.json();
    
    if (data.result && Array.isArray(data.result)) {
      allTransfers.push(...data.result);
    }
    
    cursor = data.cursor || null;
    
    // Rate limit protection
    await new Promise(r => setTimeout(r, 250));
    
  } while (cursor);
  
  return allTransfers;
}

// Main handler
Deno.serve(async (req) => {
  // 1. Validate secrets
  // 2. Parse params (wallets, dryRun, fromBlock)
  // 3. Fetch profiles cho mapping user_id
  // 4. Loop qua mỗi wallet:
  //    a. Gọi fetchAllTransfers với cursor
  //    b. Upsert vào wallet_transactions (ON CONFLICT DO NOTHING)
  //    c. Cập nhật sync_cursors
  // 5. Return summary
});
```

**Logic upsert quan trọng:**
```typescript
// Insert với conflict handling (không trùng, không mất)
const { error: insertError } = await supabase
  .from("wallet_transactions")
  .upsert({
    chain_id: 56,
    token_contract: CAMLY_TOKEN,
    tx_hash: tx.transaction_hash,
    log_index: parseInt(tx.log_index),
    from_address: tx.from_address.toLowerCase(),
    to_address: tx.to_address.toLowerCase(),
    from_user_id: walletToUserId[tx.from_address.toLowerCase()] || null,
    to_user_id: walletToUserId[tx.to_address.toLowerCase()] || null,
    amount: parseFloat(tx.value) / 1e18,
    token_type: "CAMLY",
    block_number: parseInt(tx.block_number),
    block_timestamp: tx.block_timestamp,
    status: "completed",
    created_at: tx.block_timestamp,
  }, {
    onConflict: "chain_id,token_contract,tx_hash,log_index",
    ignoreDuplicates: true
  });
```

---

### PHASE 4: Edge Function `sync-transactions-cron`

**File: `supabase/functions/sync-transactions-cron/index.ts`**

```typescript
// Nhiệm vụ: Đồng bộ incremental mỗi 1-5 phút
// Logic:
// 1. Đọc last_block_number từ sync_cursors cho mỗi system wallet
// 2. Gọi Moralis API với from_block = last_block_number + 1
// 3. Insert giao dịch mới
// 4. Cập nhật last_block_number trong sync_cursors

Deno.serve(async (req) => {
  // Có thể được gọi bởi:
  // - Cron job (pg_cron)
  // - Manual trigger từ Admin
});
```

**Thiết lập Cron Job (sau khi deploy):**
```sql
-- Chạy mỗi 5 phút
SELECT cron.schedule(
  'sync-camly-transactions',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fzgjmvxtgrlwrluxdwjq.supabase.co/functions/v1/sync-transactions-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbG..."}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);
```

---

### PHASE 5: Cập nhật `useTransactionHistory.ts`

**Thay đổi nhỏ cho wallet_transactions query:**
```typescript
// Thêm order by block_timestamp cho chính xác hơn
const walletQuery = publicMode
  ? supabase
      .from("wallet_transactions")
      .select("*")
      .eq("status", "completed")
      .not("tx_hash", "is", null)
      .order("block_timestamp", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(currentOffset, currentOffset + limit - 1)
  : ...;
```

---

## IV. FLOW DỮ LIỆU

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKFILL FLOW (1 lần)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Admin trigger backfill-moralis]                          │
│           ↓                                                 │
│  [Loop: 2 System Wallets]                                  │
│           ↓                                                 │
│  [Moralis API: getWalletTokenTransfers]                    │
│  [Với cursor pagination → lấy HẾT lịch sử]                 │
│           ↓                                                 │
│  [Parse response + map user_id từ profiles]                │
│           ↓                                                 │
│  [Upsert wallet_transactions]                              │
│  [ON CONFLICT (chain_id, token_contract, tx_hash, log_index)]
│           ↓                                                 │
│  [Cập nhật sync_cursors.last_block_number]                 │
│           ↓                                                 │
│  [Return: totalFetched, newInserted, duplicates]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              INCREMENTAL SYNC (mỗi 5 phút)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Cron trigger sync-transactions-cron]                     │
│           ↓                                                 │
│  [Đọc sync_cursors.last_block_number cho mỗi wallet]       │
│           ↓                                                 │
│  [Moralis API: from_block = last_block + 1]                │
│           ↓                                                 │
│  [Insert giao dịch mới]                                    │
│           ↓                                                 │
│  [Cập nhật last_block_number]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## V. QUY TẮC HIỂN THỊ (GIỮ NGUYÊN)

| Loại dữ liệu | Public /transactions | Personal History | Admin Dashboard |
|--------------|---------------------|------------------|-----------------|
| wallet_transactions (onchain completed) | ✅ Hiển thị | ✅ Hiển thị | ✅ Hiển thị |
| donation_transactions (onchain success) | ✅ Hiển thị | ✅ Hiển thị | ✅ Hiển thị |
| claim_requests (onchain success) | ✅ Hiển thị | ✅ Hiển thị | ✅ Hiển thị |
| reward_transactions (pending/nội bộ) | ❌ KHÔNG | ❌ KHÔNG | ✅ Chỉ Admin |

---

## VI. CÁC BƯỚC TRIỂN KHAI

```
[1] Yêu cầu MORALIS_API_KEY từ user
         ↓
[2] Migration: thêm cột mới cho wallet_transactions
         ↓
[3] Migration: tạo bảng sync_cursors
         ↓
[4] Tạo Edge Function backfill-moralis
         ↓
[5] Deploy + Test backfill cho 2 system wallets
         ↓
[6] Xác nhận số liệu khớp (> 60M CAMLY)
         ↓
[7] Tạo Edge Function sync-transactions-cron
         ↓
[8] Thiết lập Cron job (pg_cron)
         ↓
[9] Cập nhật useTransactionHistory (nếu cần)
         ↓
[10] Test UI: /transactions + personal history
```

---

## VII. KIỂM TRA DONE CRITERIA

- [ ] Backfill chạy xong → /transactions hiển thị ĐẦY ĐỦ giao dịch IN/OUT của 2 ví hệ thống
- [ ] Tổng CAMLY >= 60M (khớp với thực tế onchain)
- [ ] Không bị miss giao dịch do multi-log events (kiểm tra log_index)
- [ ] Personal history hiển thị đúng cho từng user
- [ ] Incremental sync hoạt động (giao dịch mới tự động xuất hiện)
- [ ] Export CSV/PDF hoạt động cho cả public và personal

---

## VIII. LƯU Ý QUAN TRỌNG

1. **MORALIS_API_KEY** cần được thêm trước khi triển khai
2. **Backup wallet_transactions** trước khi migration
3. **Không xóa dữ liệu cũ** - upsert sẽ merge với dữ liệu hiện có
4. **Rate limit Moralis**: Free tier = 25 req/s, thêm delay 250ms giữa các request
5. **Block timestamp** chính xác hơn `created_at` cho thứ tự giao dịch
6. **log_index** quan trọng để phân biệt multi-transfer trong 1 tx
