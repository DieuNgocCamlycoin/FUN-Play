
# Fix FUN PLAY TREASURY Wallet Address and Optimize Reward History System

## Problem Found
The FUN PLAY TREASURY account has TWO wallet addresses used in different contexts:
- **New auto-reward wallet**: `0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC` (current profile wallet, used for new claims)
- **Old treasury wallet**: `0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998` (historical transactions from 25/11/2025 to 08/01/2026)

The `systemWallets.ts` config only recognizes the OLD address for TREASURY, so transactions from the NEW auto-reward wallet (`0x9848...`) are NOT branded as "FUN PLAY TREASURY" in the transaction history. This causes incorrect display.

## Changes

### 1. Update `src/config/systemWallets.ts` - Add the new auto-reward wallet
- Add a new system wallet entry `AUTO_REWARD` for address `0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC` with display name "FUN PLAY TREASURY" (same branding as TREASURY)
- Update `getSystemWalletInfo()` to check all 4 wallets (REWARD, TREASURY, PERSONAL, AUTO_REWARD)
- This ensures claim transactions from either wallet display correctly as "FUN PLAY TREASURY"

### 2. Optimize `src/hooks/useRewardStatistics.tsx` - Eliminate redundant queries
- The `useRewardStatistics` hook makes 3 separate database queries (profile, all transactions for breakdown, recent transactions for daily chart)
- Replace with a single query approach: use `total_camly_rewards` from profile and aggregate transactions in one query
- Remove the redundant daily rewards query since `RewardHistory.tsx` already uses the `get_user_activity_summary` RPC for accurate totals

### 3. Optimize `src/pages/RewardHistory.tsx` - Minor cleanup
- The page is well-structured but has a minor issue: `debouncedRefresh` callback depends on `[user]` but calls `fetchTransactions` which is defined inside the component - this works but can be cleaner
- Remove unused `useRef` import cleanup if any
- Ensure consistent display of TREASURY branding in the claim history section

### 4. Optimize `src/hooks/useTransactionHistory.ts` - Reduce unnecessary queries
- The realtime subscription listens to ALL inserts/updates on `wallet_transactions`, `donation_transactions`, `claim_requests` without filtering by user in private mode - this causes unnecessary refreshes
- Add user-specific filters to realtime subscriptions in private mode to reduce unnecessary refetches
- Remove redundant `transactions` from `useCallback` dependency array of `fetchTransactions` to prevent stale closure issues

### 5. Update Edge Functions consistency
- `supabase/functions/get-claim-receipt/index.ts`: Does not include TREASURY sender info in the response - the receipt page needs to know the sender is TREASURY
- `supabase/functions/get-donation-receipt/index.ts`: Already has correct `0x9848...` address - no change needed

## Technical Summary

| File | Change | Impact |
|------|--------|--------|
| `systemWallets.ts` | Add AUTO_REWARD wallet `0x9848...` | Fix TREASURY branding for new claims |
| `useRewardStatistics.tsx` | Reduce from 3 queries to 1 | Less database load |
| `useTransactionHistory.ts` | Add user filter to realtime subs, fix dependency array | Fewer unnecessary refetches |
| `RewardHistory.tsx` | Minor cleanup | Cleaner code |
| `get-claim-receipt/index.ts` | Add TREASURY sender info to response | Complete receipt data |

All changes work on both web and mobile since they are data/logic layer changes, not UI layout changes.
