

# Abuse Detection System: Final Dead Code Cleanup

## System Status: Working Correctly

The real-time abuse detection system is fully operational:

- **IP Tracking** (`IPAbuseDetectionTab`): Subscribes to `profiles` + `ip_tracking` tables with 1.5s debounce. When a user creates a new account from a shared IP, the `ip_tracking` insert triggers a real-time update and the IP cluster refreshes automatically. The "Live" badge confirms the connection.
- **User Management** (`useAdminManage`): Subscribes to `profiles` with 1s debounce. Detects shared wallets client-side.
- **Dashboard Stats** (`useAdminRealtime`): Subscribes to `profiles` + `reward_transactions` + `claim_requests` with 1s debounce.

All three channels have proper debouncing to prevent database hammering during bulk operations.

## Remaining Issue: Dead `onUnban` Prop

The `onUnban` prop (simple unban without reward restore option) is still passed to `WalletAbuseTab` from **2 call sites** but is **never used** inside the component. The component only uses `onUnbanWithRestore` (which handles both cases via the restore checkbox).

### Files to Change

1. **`WalletAbuseTab.tsx`**: Remove `onUnban` from the `WalletAbuseTabProps` interface and the component destructuring
2. **`UnifiedAdminDashboard.tsx`** (line 124): Remove `onUnban={unbanUser}` prop
3. **`RewardsManagementTab.tsx`** (line 81): Remove `onUnban={unbanUser}` prop

### Impact
- Smaller prop surface, cleaner code
- No functional change -- `onUnbanWithRestore` already covers both "unban only" and "unban + restore" scenarios via the checkbox in the dialog

