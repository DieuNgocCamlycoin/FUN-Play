

# Clean Up Remaining Inefficiencies in Reward System

## Current Status
The previous round of fixes was applied correctly:
- AUTO_REWARD wallet (`0x9848...`) is properly configured and used for claim transactions
- Realtime subscriptions have user-specific filters
- Stale closure in RewardHistory.tsx is fixed with `fetchRef`
- `useRewardStatistics` uses the RPC instead of raw queries

## Remaining Issues Found

### 1. `useRewardHistory` fetches too much data (useRewardStatistics.tsx lines 82-116)
The `useRewardHistory` hook uses `SELECT *` with a join on `videos (title)` and fetches 100 rows. However, `UserDashboard.tsx` (the only consumer) only displays basic fields (amount, reward_type, created_at, video title). Fetching all columns wastes bandwidth.

### 2. Dead code in `useRewardStatistics.tsx`
- `DailyReward` interface (lines 10-13) is unused
- `dailyRewards: []` property (line 62) is always empty and never read by any consumer
- These can be removed to simplify the code

## Changes

### File: `src/hooks/useRewardStatistics.tsx`

1. **Optimize `useRewardHistory` query**: Replace `SELECT *` with only the needed columns: `id, amount, reward_type, created_at, claimed, approved, video_id, videos(title)`. This reduces data transfer.

2. **Remove dead code**: Remove `DailyReward` interface and `dailyRewards` from the `UserStatistics` type and the hook output.

### File: `src/pages/UserDashboard.tsx`

3. No changes needed -- it already reads only the fields it needs from the hook output.

## Technical Summary

| File | Change | Impact |
|------|--------|--------|
| `useRewardStatistics.tsx` | Select only needed columns in useRewardHistory | Less data transferred |
| `useRewardStatistics.tsx` | Remove DailyReward interface and dailyRewards property | Cleaner types, less dead code |

These are minor cleanup changes. The core wallet display and optimization fixes from the previous round are already working correctly.

