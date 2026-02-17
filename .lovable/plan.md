
# Fix FUN PLAY TREASURY Wallet Display and Optimize Reward History System

## Issues Found

### 1. Claim transactions show wrong TREASURY wallet address
In `useTransactionHistory.ts` (line 385-391), ALL claim_requests use `SYSTEM_WALLETS.TREASURY.address` (`0x1DC24...`) as the sender wallet. However, new claims are sent from the AUTO_REWARD wallet (`0x9848...`). The sender wallet should be `AUTO_REWARD` for consistency with the actual on-chain transaction.

### 2. `useRewardStatistics.tsx` queries `reward_transactions` redundantly
The `useRewardStatistics` hook fetches from `reward_transactions` with a 30-day filter, but `RewardHistory.tsx` already uses the `get_user_activity_summary` RPC for accurate totals. The `UserDashboard.tsx` is the only consumer. The hook can be simplified to avoid the redundant transactions query by using the same RPC.

### 3. Stale closure in `RewardHistory.tsx`
`debouncedRefresh` (line 98-103) depends on `[user]` but calls `fetchTransactions` which is defined later and not in the dependency array. This is a stale closure bug -- on re-renders, the debounced callback may call an old version of `fetchTransactions`.

### 4. Unused `getAddressExplorerUrl` function
Defined in `useTransactionHistory.ts` (line 102-112) and exported but never used anywhere in the codebase. Dead code.

### 5. `wallet_transactions` realtime subscription has no user filter in private mode
In `useTransactionHistory.ts` (line 679-683), the `wallet_transactions` realtime subscription does NOT filter by user even in private mode. Every wallet_transactions insert from any user triggers a full refetch.

## Changes

### File: `src/hooks/useTransactionHistory.ts`

1. **Fix claim sender wallet** (line 384-391): Change from `SYSTEM_WALLETS.TREASURY` to `SYSTEM_WALLETS.AUTO_REWARD` for the sender wallet address displayed on claim transactions. This correctly shows `0x9848...` (the actual wallet that sends claim tokens).

2. **Remove unused `getAddressExplorerUrl`** (lines 102-112): Delete the function definition and remove it from the return object (line 726).

3. **Add user filter to wallet_transactions realtime** (lines 679-683): In private mode, add `from_user_id` and `to_user_id` filters to avoid unnecessary refetches when other users' transactions arrive.

### File: `src/hooks/useRewardStatistics.tsx`

4. **Optimize by using RPC instead of raw query**: Replace the `reward_transactions` query with the `get_user_activity_summary` RPC (same one used by `RewardHistory.tsx`). This eliminates a redundant query and provides more accurate data. The `useRewardHistory` sub-hook can also use a more targeted query with only needed columns.

### File: `src/pages/RewardHistory.tsx`

5. **Fix stale closure**: Add `fetchTransactions` to the `debouncedRefresh` callback's logic, or use a ref-based approach so the debounced callback always calls the latest version.

## Technical Summary

| File | Change | Impact |
|------|--------|--------|
| `useTransactionHistory.ts` | Use AUTO_REWARD wallet for claim sender display | Correct wallet address shown |
| `useTransactionHistory.ts` | Remove unused `getAddressExplorerUrl` | Cleaner code, less dead code |
| `useTransactionHistory.ts` | Add user filter to wallet_transactions realtime | Fewer unnecessary refetches |
| `useRewardStatistics.tsx` | Use RPC instead of raw query | 1 fewer DB query |
| `RewardHistory.tsx` | Fix stale closure in debouncedRefresh | Correct realtime refresh behavior |
