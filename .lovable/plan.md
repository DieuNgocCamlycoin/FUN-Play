

## Problem

The red error toast "Không thể đổi ví" appears for all users because:
1. The `WALLET_CHANGE_DISABLED` flag in `reward_config` is set globally to block all wallet changes
2. `saveWalletToDb` sometimes triggers the RPC `request_wallet_change` even during normal reconnection (when `previousAddressRef` is already set but the address is the same)

The toast should only appear when a user **explicitly** tries to change their wallet (e.g., from Settings), not during automatic reconnection.

## Plan

### 1. Fix `saveWalletToDb` in `src/hooks/useWalletConnection.ts`

Add a check: if the new wallet address is the **same** as `previousAddressRef.current`, skip the RPC call entirely (no need to "change" to the same wallet). Only call `request_wallet_change` RPC when the address is actually different AND the user has an existing wallet.

```typescript
// In saveWalletToDb:
const isFirstSave = !previousAddressRef.current;
const isSameWallet = previousAddressRef.current?.toLowerCase() === walletAddress.toLowerCase();

if (isFirstSave) {
  // Direct update for first-time connection
} else if (isSameWallet) {
  // Same wallet reconnecting — just update wallet_type if needed, no RPC
} else {
  // Actual wallet CHANGE — go through RPC
}
```

This single change prevents the red toast from appearing during normal wallet reconnections while preserving the security check for actual wallet changes.

