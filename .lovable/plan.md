

# Remove Daily Progress Card from Reward History

## What will be removed

The "Daily Progress" card (lines 340-389 in `src/pages/RewardHistory.tsx`) that shows progress bars for views, likes, comments, shares, short videos, and long videos with their daily limits and totals.

## Changes

### File: `src/pages/RewardHistory.tsx`

1. **Remove the Daily Progress card JSX** (lines 340-389) -- the entire `{dailyProgress && (...)}` block
2. **Remove the `dailyProgress` state** (lines 95-98)
3. **Remove the `fetchDailyProgress` function** (lines 108-112)
4. **Remove `fetchDailyProgress()` call** from the `debouncedRefresh` callback (line 104) and from the `useEffect` (line 118)
5. **Remove unused imports**: `Progress`, `getDailyRewardStatus`, `DAILY_LIMITS`, `REWARD_AMOUNTS`, and the `Calendar` icon (since it's only used by the daily progress card)

### No other files need changes
The reward system logic in `enhancedRewards.ts` and the `award-camly` edge function remain untouched -- only the UI display is being removed.

