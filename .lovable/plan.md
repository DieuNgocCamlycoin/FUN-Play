

# Fix Daily Limit Violations for Video Upload Rewards

## Problems Found

### Problem 1: LONG_VIDEO_UPLOAD Daily Limit Violations (max 3/day)
- **10 users** exceeded the 3 long videos/day limit
- **61 excess transactions** totaling **4,270,000 CAMLY** overpaid
- Worst case: "Angel QuynhHoa" uploaded 12 long videos in one day (9 over limit = 630,000 excess)

| User | Date | Count | Limit | Excess | Excess CAMLY |
|------|------|-------|-------|--------|-------------|
| Angel QuynhHoa | 2026-02-12 | 12 | 3 | 9 | 630,000 |
| Nguyen Hoa_Richer | 2026-02-12 | 10 | 3 | 7 | 490,000 |
| Angel Vinh Nguyen | 2026-02-12 | 10 | 3 | 7 | 490,000 |
| Angel Quynh Hoa | 2026-02-12 | 9 | 3 | 6 | 420,000 |
| Mau Tran | 2026-02-12 | 9 | 3 | 6 | 420,000 |
| ...and 10 more date-user combos | | | | | |

### Problem 2: SHORT_VIDEO_UPLOAD Daily Limit Violations (max 5/day)
- **22 users** exceeded the 5 short videos/day limit
- **352 excess transactions** totaling **7,040,000 CAMLY** overpaid
- Worst case: "Tran Van Luc" uploaded 68 short videos in one day (63 over limit = 1,260,000 excess)

### Problem 3: Daily Total Cap Violations (max 500,000 CAMLY/day)
- Over 30 user-day combinations exceeded the 500,000 CAMLY daily cap
- This overlaps significantly with the upload limit violations

### No Misclassification Issues
- **0 videos** longer than 3 minutes are incorrectly showing 20,000 CAMLY (all clean)

## Solution

### Step 1: Remove Excess LONG_VIDEO Transactions
For each user+date that exceeded 3 long video uploads, keep the first 3 (ordered by created_at) and delete the rest. This removes 61 transactions worth 4,270,000 CAMLY.

### Step 2: Remove Excess SHORT_VIDEO Transactions
For each user+date that exceeded 5 short video uploads, keep the first 5 and delete the rest. This removes 352 transactions worth 7,040,000 CAMLY.

### Step 3: Sync All User Balances
Run `sync_reward_totals()` to recalculate `approved_reward` and `total_camly_rewards` for all affected users based on the corrected transaction history.

### Step 4: Verify
- Confirm 0 daily limit violations remain
- Confirm all user balances match transaction history

## Technical Details

### SQL for Step 1 (delete excess LONG_VIDEO):
```sql
DELETE FROM reward_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
      ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
    FROM reward_transactions
    WHERE reward_type = 'LONG_VIDEO_UPLOAD' AND status = 'success'
  ) ranked
  WHERE rn > 3
);
```

### SQL for Step 2 (delete excess SHORT_VIDEO):
```sql
DELETE FROM reward_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
    FROM reward_transactions
    WHERE reward_type = 'SHORT_VIDEO_UPLOAD' AND status = 'success'
  ) ranked
  WHERE rn > 5
);
```

### SQL for Step 3:
```sql
SELECT * FROM sync_reward_totals();
```

### Impact Summary
- **Total CAMLY to be deducted**: ~11,310,000 (4,270,000 long + 7,040,000 short)
- **Users affected**: ~25 unique users
- **No code changes needed** -- the edge function already enforces daily limits correctly going forward. These are historical violations from before the limits were properly enforced.

