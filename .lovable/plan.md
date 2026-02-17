

# Final Cleanup: Remove Dead Chart UI and Optimize Claim Query

## Current Status
All core fixes from previous rounds are working correctly:
- AUTO_REWARD wallet (`0x9848...`) is properly configured and displays as "FUN PLAY TREASURY"
- Realtime subscriptions have user-specific filters in private mode
- `useRewardStatistics` uses the RPC for accurate totals
- Stale closure in RewardHistory.tsx is fixed with `fetchRef`
- Dead code (`DailyReward`, `getAddressExplorerUrl`) has been removed

## Remaining Issues

### 1. Dead chart UI in UserDashboard.tsx
The "Timeline" tab (lines 266-297) renders a `LineChart` with permanently empty data (`chartData = []`). This was left over after removing `dailyRewards` from the statistics hook. The tab renders an empty chart area, wasting resources and confusing users.

**Fix**: Remove the entire "Timeline" `TabsContent` block along with the now-unnecessary `chartData` variable. Also remove the "Timeline" tab trigger. If the chart imports (`LineChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Line`, `ResponsiveContainer`) are only used by this chart, remove those imports too.

### 2. Unoptimized claim history query in RewardHistory.tsx
`fetchClaimHistory` (line 160) uses `SELECT *` on `claim_requests` but the UI only uses 8 specific fields. Selecting all columns wastes bandwidth.

**Fix**: Replace `.select("*")` with `.select("id, amount, wallet_address, status, tx_hash, created_at, processed_at, error_message")`.

## Technical Summary

| File | Change | Impact |
|------|--------|--------|
| `UserDashboard.tsx` | Remove dead Timeline tab and empty chart | Less rendering, cleaner UI |
| `UserDashboard.tsx` | Remove unused chart-related imports | Smaller bundle |
| `RewardHistory.tsx` | Select only needed columns in claim query | Less data transferred |

These are the final cleanup items. After this, the reward history system will be fully optimized with no dead code or unnecessary resource usage.

