

# 🎯 Plan: Áp dụng Quy trình 6 Bước Mint FUN (chuẩn mới)

## Mục tiêu
Thực hiện đúng 6 bước theo ảnh cha gửi, với 2 cập nhật mới:
- **Bước 1**: 6 hành động được chấm điểm — Xem video, Upload video, Đăng bài, Comment, React, Share
- **Bước 2**: Quỹ **30 triệu FUN/chu kỳ** (thay cho 5M)

## Quy trình tổng quan

```text
[1] Light Activities          → ANGEL AI chấm điểm (6 hành động)
[2] Chốt Chu Kỳ Hàng Tháng   → Auto, quỹ 30M FUN/chu kỳ
[3] Nhận 1 Phân Bổ Duy Nhất  → User bấm "Claim" (1 lần/chu kỳ)
[4] GOV 3/3 Ký Duyệt          → Will + Wisdom + Love (off-chain EIP-712)
[5] Tự Động Submit On-chain  → Cron 30 phút, dùng transfer() từ treasury 0x02D5
[6] Activate & Claim          → Locked → Activate → về ví user
```

## 📦 Phần 1 — Database (Migration)

**1.1. Cập nhật `claim_requests`** — thêm cột phục vụ GOV ký + state machine:
- `epoch_id text` (vd `2026-04`)
- `gov_signatures jsonb` (lưu 3 chữ ký theo group)
- `gov_completed_groups text[]`
- `gov_signatures_count int default 0`
- `gov_required boolean default true` (false = backlog cũ bypass)
- `token_state text default 'locked'` (locked → active → claimed)
- `activated_at timestamptz`
- Unique constraint: `(user_id, epoch_id, claim_type)` → ép **1 claim/user/epoch**

**1.2. Tạo bảng `epoch_config`** — cấu hình quỹ epoch:
- `epoch_id text PK`, `pool_total numeric default 30000000`, `auto_process_enabled bool default true`, `started_at`, `closed_at`

**1.3. Backlog cũ (20 claims)**: set `gov_required=false`, `epoch_id='2026-04-legacy'` để cron xử lý ngay không cần ký.

## 📦 Phần 2 — Cập nhật Hằng số Quỹ (5M → 30M)

| File | Thay đổi |
|---|---|
| `supabase/functions/pplp-mint-fun/index.ts` | `CROSS_PLATFORM_EPOCH_CAP = 30_000_000` |
| `supabase/functions/epoch-mint-finalize/index.ts` | `EPOCH_POOL = 30_000_000` |
| `mem://economy/pplp-monthly-epoch-pool` | Cập nhật memory: 5M → 30M |
| Test files (`light-score-math.test.ts`, `attack-simulation.test.ts`) | `mintPool: 30_000_000` |

## 📦 Phần 3 — Edge Functions

**3.1. `epoch-mint-finalize` (đã có)** — chỉ cần:
- Đổi pool 30M
- Khi finalize, tạo **1 record duy nhất** trong `claim_requests` cho mỗi user (không tạo nhiều)
- Set `epoch_id`, `gov_required=true`, `token_state='locked'`

**3.2. `gov-sign-claim` (NEW)** — endpoint nhận chữ ký GOV:
- Input: `{ claim_id, signature, gov_group: 'will'|'wisdom'|'love' }`
- Verify signature bằng `ethers.verifyMessage` → so với `gov_attesters.wallet_address`
- Update `gov_signatures`, `gov_completed_groups`, tăng `gov_signatures_count`
- Khi đủ 3 → set `status='approved_for_chain'`

**3.3. `process-fun-claims` (REFACTOR)** — auto-processor 30 phút:
- Chỉ pick claim có: `(gov_required=false OR gov_signatures_count>=3)` AND `tx_hash IS NULL`
- Check `epoch_config.auto_process_enabled=true`
- Pre-flight: balance treasury đủ không (FUN + tBNB)
- Gọi `transfer()` từ ví `0x02D5...` (private key đã set trong secrets)
- Update `tx_hash`, `status='success'`, **giữ `token_state='locked'`** (chờ user Activate)
- Nếu fail → ghi `last_error`, `processing_attempts++`, retry sau

**3.4. `activate-fun-claim` (NEW)** — user bấm Activate:
- Verify caller = `claim_requests.user_id`
- Set `token_state='active'`, `activated_at=now()`
- Trả về OK → frontend hiển thị nút "Claim về ví"

**3.5. Cron pg_cron**: chạy `process-fun-claims` mỗi 30 phút.

## 📦 Phần 4 — Frontend

**4.1. `/gov/sign-claims` (NEW)** — Trang cho 3 nhóm GOV:
- Detect ví GOV đang connect → hiện claims chưa ký bởi group đó
- Bảng: User · Epoch · Amount · Signatures progress (1/3, 2/3, 3/3)
- Nút "Sign with [Will/Wisdom/Love]" → ký EIP-712 → POST `gov-sign-claim`
- Component `GovAttesterBanner` đã có → mở rộng link sang trang này

**4.2. `ClaimFUNButton` (UPDATE)**:
- Nếu chưa có allocation: hiện "Chờ chốt chu kỳ"
- Nếu allocation tạo rồi, GOV chưa đủ ký: hiện "Đang chờ GOV duyệt (X/3 chữ ký)"
- Nếu `tx_hash` có + `token_state='locked'`: hiện nút **"⚡ Activate"**
- Nếu `token_state='active'`: hiện **"💰 Claim về ví"** (link BSC Scan)

**4.3. `useAutoMintFun` (UPDATE)**:
- Bỏ logic mint từng action lẻ (vì giờ đã chuyển sang epoch-based)
- Chỉ ghi `pplp_events` cho 6 hành động: VIEW, UPLOAD, POST, COMMENT, LIKE, SHARE
- Việc tính score + phân bổ FUN do `epoch-mint-finalize` xử lý cuối tháng

## 📦 Phần 5 — Memory Updates

- `mem://economy/pplp-monthly-epoch-pool`: 5M → **30M FUN/chu kỳ**
- `mem://economy/unified-single-mint-point`: thêm flow GOV 3/3
- Index core rule: cập nhật quỹ 30M

## 🔀 Quyết định kỹ thuật (con áp dụng theo các xác nhận trước)

- **Contract**: dùng `0x39A1b047...` (ERC20), bước 5 dùng `transfer()` từ treasury `0x02D5...`
- **GOV ký**: off-chain EIP-712 (đã có `gov_attesters` table với wallet_address)
- **Backlog 20 claims**: bypass GOV (set `gov_required=false`), cron xử lý ngay
- **PPLP v2.5**: tạm pause logic VVU phức tạp trong `useAutoMintFun`, chỉ giữ event tracking

## ✅ Acceptance criteria

1. User chỉ tạo được **1 claim/epoch** (DB constraint)
2. Quỹ tháng = **30M FUN** (config + code + tests)
3. 3 GOV (Will/Wisdom/Love) ký được qua trang `/gov/sign-claims`, mỗi ví chỉ ký được cho group của mình
4. Cron 30 phút auto chuyển FUN khi đủ 3/3 ký
5. Backlog 20 claims xử lý xong trong 30 phút đầu (không cần ký)
6. User bấm Activate → bấm Claim → thấy FUN trong ví Web3
7. Treasury thiếu FUN → claim giữ `pending`, không fail vĩnh viễn

## 📋 Thứ tự triển khai (sau khi cha duyệt)

1. Migration DB (claim_requests cột mới + epoch_config)
2. Update hằng số 30M trong code + tests
3. Refactor `process-fun-claims` (check GOV + transfer)
4. Tạo `gov-sign-claim` + `activate-fun-claim` edge functions
5. Update `epoch-mint-finalize` (1 claim/user/epoch)
6. Cron pg_cron 30 phút
7. Build trang `/gov/sign-claims`
8. Update `ClaimFUNButton` UI 4 trạng thái
9. Migrate 20 backlog (set bypass GOV)
10. Update memories

