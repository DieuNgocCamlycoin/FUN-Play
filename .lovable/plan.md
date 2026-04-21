

## Triển khai mint FUN qua `lockWithPPLP` (v1) — Lựa chọn 1A + 2B + 3B

Dựa trên xác nhận của cha:
- **1A**: Dùng v1 `lockWithPPLP` trên contract `0x39A1b047...` (không deploy mới)
- **2B**: Tạo bảng `pplp_mint_requests_v2` song song
- **3B**: Cancel 7 pending + 11 failed claim cũ, user tự re-claim qua flow mới
- Ví `0x02D5...` đã `isAttester=true`, action `FUN_REWARD` đã `govRegisterAction`, threshold=3

---

### Phase A — Schema mới `pplp_mint_requests_v2` (migration)

Bảng song song với cột đầy đủ theo spec mint-fun-kit:

```text
pplp_mint_requests_v2:
  id (uuid, pk)
  user_id (uuid)
  recipient_address (text)            -- ví user nhận FUN
  action_name (text)                  -- 'FUN_REWARD'
  action_hash (bytea)                 -- keccak256(action_name)
  amount_wei (numeric)                -- amount * 1e18
  amount_display (numeric)            -- amount FUN human readable
  evidence_hash (bytea)               -- keccak256(evidence JSON)
  policy_version (int, default 1)
  nonce (numeric)                     -- on-chain nonce per user
  deadline (bigint)                   -- unix timestamp
  digest (bytea)                      -- EIP-712 digest cần ký
  signatures (jsonb, default '[]')    -- mảng {attester, signature}
  signatures_count (int, default 0)
  status (text)                       -- pending_sig | signed | broadcasting | minted | failed | cancelled
  tx_hash (text)
  block_number (bigint)
  error_message (text)
  processing_attempts (int, default 0)
  locked_at (timestamptz)
  created_at, updated_at, minted_at
```

RLS:
- User SELECT row của mình
- Service role full access
- Attester (gov) SELECT all + UPDATE signatures

Index: `(status, created_at)`, `(user_id, status)`, `(recipient_address)`

---

### Phase B — Edge functions mới

**B1. `pplp-mint-create-request` (mới)**
- Input: `{ user_id, recipient_address, amount, evidence }`
- Đọc nonce hiện tại từ contract `0x39A1b047...` qua `nonces(address)`
- Tính `evidence_hash = keccak256(JSON.stringify(evidence))`
- Tính EIP-712 digest theo schema `lockWithPPLP(action, recipient, amount, evidence, nonce, deadline)`
- Insert row `pplp_mint_requests_v2` status=`pending_sig`
- Trả về `{ request_id, digest, deadline, nonce }` cho UI/attester

**B2. `pplp-mint-add-signature` (mới)**
- Input: `{ request_id, attester_address, signature }`
- Verify signature recover về đúng attester wallet
- Verify `isAttester(attester) = true` qua RPC
- Append vào `signatures` array, tăng `signatures_count`
- Khi `signatures_count >= attesterThreshold (3)` → status=`signed`, enqueue broadcast

**B3. `pplp-mint-broadcast` (mới, cron 1 phút)**
- Pick `status=signed` AND `tx_hash IS NULL`
- Lock row 5 phút, dùng ví `FUN_TREASURY_PRIVATE_KEY` (cha ơi: ví `0x02D5...` lo gas)
- Gọi `lockWithPPLP(action_hash, recipient, amount_wei, evidence_hash, nonce, deadline, signatures[])`
- Wait receipt → status=`minted`, lưu `tx_hash`, `block_number`
- Lỗi → tăng `processing_attempts`, sau 5 lần → `failed`

**B4. Sửa `process-fun-claims` (giữ tương thích)**
- Phát hiện claim mới (sau timestamp X) → tạo row trong `pplp_mint_requests_v2` thay vì `transfer()`
- Claim cũ trước timestamp X → giữ logic transfer hiện tại (nhưng đã rollback trong Phase D)

**B5. Sửa `pplp-mint-fun` (mới)**
- Khi auto-mint từ `useAutoMintFun` → gọi `pplp-mint-create-request` thay vì insert thẳng `pplp_mint_requests`

---

### Phase C — UI Attester signing

**C1. Sửa `useAttesterSigning.ts`**
- Đọc `pplp_mint_requests_v2` thay vì `pplp_mint_requests`
- Show queue request `pending_sig`/`signed`
- Mỗi request: show digest + button "Sign with wallet"
- Ký xong → call `pplp-mint-add-signature`

**C2. Trang admin `/admin/pplp/attester-queue` (sửa hoặc thêm tab)**
- Show pending signatures, ai đã ký, còn thiếu mấy chữ ký
- Show broadcast queue + tx_hash khi mint xong

---

### Phase D — Xử lý 7 pending + 11 failed claim cũ (3B)

```sql
UPDATE claim_requests
SET status = 'cancelled',
    error_message = 'Migrated to v2 mint pipeline. Please re-claim.',
    locked_at = NULL
WHERE claim_type = 'fun_money'
  AND status IN ('pending', 'approved', 'approved_for_chain', 'failed')
  AND tx_hash IS NULL;
```

Gửi notification cho user đã claim (qua bảng `notifications`):
- "Hệ thống mint FUN đã nâng cấp. Hãy re-claim phần thưởng của bạn."

---

### Phase E — Secrets & config

Cần kiểm tra/thêm:
- `FUN_TREASURY_PRIVATE_KEY` (đã có) — dùng để broadcast `lockWithPPLP`
- `BSC_TESTNET_RPC_URL` (mặc định `data-seed-prebsc-1-s1.binance.org`)
- `FUN_CONTRACT_ADDRESS` = `0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6`
- `FUN_ATTESTER_THRESHOLD` = 3

Cron jobs (qua `pg_cron`):
- `pplp-mint-broadcast` mỗi 1 phút
- Cleanup expired requests mỗi 1 giờ (deadline < now → status=`failed`)

---

### Phase F — Memory updates

- Cập nhật `mem://web3/fun-money-minter-architecture` → ghi rõ contract `0x39A1b047...` dùng `lockWithPPLP` v1, ví `0x02D5...` là attester+broadcaster
- Tạo mới `mem://web3/pplp-v2-mint-pipeline` → flow 3 bước (create → sign 3/3 → broadcast)
- Update Core rule: "Mint FUN qua `lockWithPPLP` v1, threshold 3 attesters, broadcaster=treasury 0x02D5..."

---

### Acceptance criteria

1. Bảng `pplp_mint_requests_v2` tồn tại + RLS đúng
2. 3 edge function mới deploy + cron hoạt động
3. Test E2E: user trigger action → tạo request → 3 attester ký → broadcast lên chain → tx_hash về DB
4. 7 pending + 11 failed claim cũ đã `cancelled`, user nhận notification
5. UI `useAttesterSigning` hiện queue mới
6. Memory đã cập nhật

---

### Files

**Tạo mới (5)**:
1. `supabase/migrations/<timestamp>_pplp_mint_requests_v2.sql`
2. `supabase/functions/pplp-mint-create-request/index.ts`
3. `supabase/functions/pplp-mint-add-signature/index.ts`
4. `supabase/functions/pplp-mint-broadcast/index.ts`
5. `src/lib/fun-money/lockWithPPLP-eip712.ts` (helper compute digest client-side)

**Sửa (4)**:
1. `supabase/functions/pplp-mint-fun/index.ts` (route sang v2)
2. `supabase/functions/process-fun-claims/index.ts` (route sang v2 cho claim mới)
3. `src/hooks/useAttesterSigning.ts` (đọc bảng v2)
4. `src/components/admin/PplpMintTab.tsx` (queue v2)

**Migration data** (qua insert tool sau khi schema xong):
- Cancel 7+11 claim cũ + insert notification

---

### Thứ tự triển khai

1. Migration `pplp_mint_requests_v2` + RLS
2. Helper EIP-712 digest (client + server share)
3. Edge `pplp-mint-create-request` + test với 1 user
4. Edge `pplp-mint-add-signature` + UI attester
5. Edge `pplp-mint-broadcast` + cron
6. E2E test 1 mint nhỏ
7. Route `pplp-mint-fun` + `process-fun-claims` sang v2
8. Cancel 18 claim cũ + notification
9. Memory updates

