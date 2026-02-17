

# Add "Restore Rewards" Option to Unban Dialog

## What This Solves
When you unban an accidentally banned user, their rewards were permanently zeroed by `ban_user_permanently`. Currently there is no way to restore them. This adds an optional checkbox to recalculate and restore their rewards from transaction history.

## How It Works

The existing `sync_reward_totals()` database function already recalculates `pending_rewards` and `approved_reward` from the `reward_transactions` table. We will create a targeted version that works for a single user, then wire it into the unban dialog.

## Changes

### 1. New Database Function: `restore_user_rewards`
A new RPC that recalculates a single user's reward balances from `reward_transactions`:

```text
restore_user_rewards(p_user_id, p_admin_id)
  -> Recalculates pending_rewards and approved_reward from reward_transactions
  -> Returns the restored amounts
  -> Logs the restoration in reward_approvals
  -> Admin-only access check
```

### 2. `src/hooks/useAdminManage.ts`
- Add `unbanUserWithRestore(userId: string, restoreRewards: boolean)` function
- If `restoreRewards` is true, call `restore_user_rewards` RPC after unbanning
- Expose this new function

### 3. `src/components/Admin/tabs/IPAbuseDetectionTab.tsx`
- Add a checkbox state inside the unban AlertDialog: "Khoi phuc thuong (Restore previous rewards)"
- When checked, the unban action calls `unbanUserWithRestore(userId, true)` instead of plain `unbanUser(userId)`
- Show a brief explanation: rewards will be recalculated from transaction history
- Update `onUnban` prop type to accept the restore flag: `(userId: string, restoreRewards?: boolean) => Promise<boolean>`

### 4. `src/components/Admin/tabs/WalletAbuseTab.tsx`
- Update prop passthrough to match new signature

### 5. Parent components (`UnifiedAdminDashboard.tsx`, `RewardsManagementTab.tsx`)
- Wire the new `unbanUserWithRestore` function through

## Technical Details

**Database function logic:**
```sql
-- Sum unclaimed, unapproved transactions -> pending_rewards
-- Sum unclaimed, approved transactions -> approved_reward
-- Update profiles with recalculated values
-- Log in reward_approvals as 'restored'
```

This reuses the same logic as `sync_reward_totals()` but scoped to one user, making it lightweight and safe.

**UI:** The checkbox defaults to unchecked (safe default). When checked, the dialog description updates to explain that rewards will be recalculated from history.

## No Other Files Change
- Edge functions remain unchanged
- BannedScreen remains unchanged
- Other admin tabs remain unchanged

