

# Update LIKE Reward to 2,000 CAMLY and Add Daily Progress

## Current State

| Source | LIKE Value | Status |
|--------|-----------|--------|
| Edge function default | 2,000 | Correct |
| Database `reward_config` | 5,000 | Wrong - needs update to 2,000 |
| Client `enhancedRewards.ts` | 5,000 | Wrong - needs update to 2,000 |

The database value overrides the edge function default, so users are currently receiving 5,000 CAMLY per like instead of the intended 2,000.

## Changes

### 1. Update Database `reward_config` (Data Update)
Update the `LIKE_REWARD` config value from `5000` to `2000` using the insert tool:
```sql
UPDATE reward_config SET config_value = '2000' WHERE config_key = 'LIKE_REWARD';
```

### 2. Update Client Constant (`src/lib/enhancedRewards.ts`)
Change line 7 from `LIKE: 5000` to `LIKE: 2000` to match the edge function and database.

### 3. Add Daily Progress Card (`src/pages/RewardHistory.tsx`)
Add a "Daily Progress" section after the header showing today's usage vs. limits:
- Views: X/10 (5,000 CAMLY each)
- Likes: X/20 (2,000 CAMLY each)
- Comments: X/10 (5,000 CAMLY each)
- Shares: X/10 (5,000 CAMLY each)
- Short Videos: X/5 (20,000 CAMLY each)
- Long Videos: X/3 (70,000 CAMLY each)
- Total daily earnings vs. 500,000 CAMLY hard cap

The card fetches from the `daily_reward_limits` table for today's date and auto-refreshes on `camly-reward` events.

### 4. No Edge Function Change Needed
The edge function already has `LIKE: 2000` as default, and will now load `2000` from the database too.

## Reward Formula Summary (After Fix)

| Action | Reward | Daily Limit | Max Daily |
|--------|--------|-------------|-----------|
| View | 5,000 | 10 views | 50,000 |
| Like | 2,000 | 20 likes | 40,000 |
| Comment | 5,000 | 10 comments | 50,000 |
| Share | 5,000 | 10 shares | 50,000 |
| Short Video Upload | 20,000 | 5 videos | 100,000 |
| Long Video Upload | 70,000 | 3 videos | 210,000 |
| **Hard Cap** | -- | -- | **500,000/day** |

## Expected Result
- LIKE rewards correctly award 2,000 CAMLY per like (no duplicates, max 20/day)
- Reward History page shows daily progress with accurate limits and counts
- All values consistent across database, edge function, and client
