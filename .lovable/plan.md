

# Fix Remaining Long Video Reward Issues

## Problems Found

### Problem 1: 2 Legacy UPLOAD Transactions (Wrong Type)
Two transactions from user "Angel Tran Mau" use the old `UPLOAD` type (100,000 CAMLY each) for videos > 180s. These should be reclassified to `LONG_VIDEO_UPLOAD` (70,000 CAMLY).

| Video | Duration | Current Type | Current Amount | Correct Type | Correct Amount |
|-------|----------|-------------|----------------|--------------|----------------|
| Angel Tran Mau (8011b0a1) | 194s | UPLOAD | 100,000 | LONG_VIDEO_UPLOAD | 70,000 |
| Angel Tran Mau (76eb5fd4) | 230s | UPLOAD | 100,000 | LONG_VIDEO_UPLOAD | 70,000 |

**Note:** These users were actually OVERPAID (100k vs 70k). Reclassifying the type but keeping the amount at 100k to avoid taking back rewards, OR reducing to 70k for consistency. Recommendation: reduce to 70k for integrity and deduct 60,000 total from user balance.

### Problem 2: 6 Videos With NO Upload Reward (Missing Rewards)
These users uploaded long videos (> 180s) but never received any upload reward:

| User | Video | Duration | Missing Reward |
|------|-------|----------|---------------|
| Angel Kieu Phi | Nha Thong Thai Angel AI | 189s | 70,000 |
| THANH TIEN | TAM CAU THAN CHU | 215s | 70,000 |
| Angel Quynh Hoa | 1000004891 | 242s | 70,000 |
| Angel Hiep | Thu gian som mai | 270s | 70,000 |
| Nguyenthanhvi | Ngan Nam De Cau Nguyen | 815s | 70,000 |
| ANGEL-BACHVIET | Happy New Year | 328s | 70,000 |

**Total missing: 420,000 CAMLY** for 6 users.

## Solution

### Step 1: Fix the 2 legacy UPLOAD transactions
Update `reward_type` from `UPLOAD` to `LONG_VIDEO_UPLOAD` and adjust `amount` from 100,000 to 70,000. Then deduct the 60,000 CAMLY overpayment from the user's balance.

### Step 2: Create missing reward transactions for the 6 videos
Insert new `reward_transactions` with `reward_type = 'LONG_VIDEO_UPLOAD'` and `amount = 70,000` for each of the 6 missing videos. Credit each user's `approved_reward` and `total_camly_rewards` by 70,000.

### Step 3: Sync all user balances
Run `sync_reward_totals()` to ensure all profile balances match the transaction records exactly.

### Step 4: Verify
Query the database to confirm:
- 0 remaining `UPLOAD` type transactions for videos > 180s
- 0 videos > 180s missing upload rewards
- All user balances are correctly synchronized

## Technical Details

### SQL for Step 1 (legacy UPLOAD fix):
```sql
UPDATE reward_transactions
SET reward_type = 'LONG_VIDEO_UPLOAD', amount = 70000
WHERE id IN ('0789fd42-85c0-4ddb-beba-e94c45937507', '68bc1638-935d-4b67-bae6-45690d2b0d37');
```

### SQL for Step 2 (insert missing rewards):
```sql
INSERT INTO reward_transactions (user_id, video_id, amount, reward_type, status, approved, approved_at, tx_hash)
VALUES
  ('67b18962-...', '635236de-...', 70000, 'LONG_VIDEO_UPLOAD', 'success', true, now(), 'RECONCILE_LONG_...'),
  -- ... for each of the 6 videos
;
```

### SQL for Step 3 (balance sync):
```sql
SELECT sync_reward_totals();
```

No UI/mobile code changes are needed -- the Reward History page already correctly displays `LONG_VIDEO_UPLOAD` labels and amounts. Once the database is fixed, the display updates automatically on both desktop and mobile.

