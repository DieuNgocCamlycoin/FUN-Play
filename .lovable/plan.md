

# Fix: Wallet Connection Stability and Optimization

## Issues Found

### Bug 1: Stale Closure in Retry Polling Loop (Critical)
In `useWalletConnectionWithRetry.ts`, the `connectWithRetry` function polls `walletConnection.isConnected` inside a `while` loop. However, React state captured in a closure does not update between iterations -- the value is always whatever it was when the function started (usually `false`). This means the loop **always times out after 10 seconds**, even when the wallet connects successfully. The connection only works because the separate `useEffect` on line 57 eventually detects `walletConnection.isConnected` changed and updates the step.

**Fix**: Use a `ref` to track the connected state, updated via the `useEffect` that already watches `walletConnection.isConnected`. The polling loop reads from the ref instead of the stale closure value.

### Bug 2: WalletButton FUN Wallet Navigation Missing
In `WalletButton.tsx` line 251, `onSelectFunWallet` is `() => {}` -- a no-op. When users click "FUN Wallet" in the selection modal from the header button, nothing happens (the modal opens a new tab via `handleFunWallet` in `WalletSelectionModal`, but the WalletButton's own callback should navigate to `/fun-wallet`).

**Fix**: Import `useNavigate` and navigate to `/fun-wallet` when FUN Wallet is selected.

### Bug 3: Cancel Wallet Change Shows Disconnected State
In `useWalletConnection.ts` line 220, when canceling a wallet change and there is a previous wallet in the DB, `isConnected` is set to `false`. This shows the user as disconnected in the UI even though they have an active wallet saved in their profile. The `disconnect()` call is correct (it disconnects the wagmi session with the new wallet), but the UI state should reflect that the old wallet is still their registered wallet.

**Fix**: When canceling and a previous wallet exists, keep the address displayed but show a "reconnect" state rather than fully disconnected. Practically, just don't clear `isConnected` if `previousAddressRef.current` exists -- set it to `true` and show the old address.

### Optimization: Stabilize switchToBSC Reference
`switchToBSC` depends on `toast`, and the `watchAccount` effect includes `switchToBSC` in its dependency array. This can cause unnecessary re-subscriptions. Wrap `toast` usage in a ref to stabilize the callback.

## Changes

### File 1: `src/hooks/useWalletConnectionWithRetry.ts`
- Add a `isConnectedRef` that mirrors `walletConnection.isConnected`
- Update the polling loop to read `isConnectedRef.current` instead of the stale closure value
- This ensures the retry loop detects connection success immediately

### File 2: `src/components/Web3/WalletButton.tsx`
- Import `useNavigate` from react-router-dom
- Update `onSelectFunWallet` callback to navigate to `/fun-wallet`

### File 3: `src/hooks/useWalletConnection.ts`
- In `handleCancelWalletChange`: when `previousAddressRef.current` exists, set `isConnected` to `true` and show the old address, since the user still has a registered wallet
- Stabilize `switchToBSC` by using a ref for `toast` to prevent unnecessary `watchAccount` re-subscriptions

## Summary

| File | Change |
|------|--------|
| `src/hooks/useWalletConnectionWithRetry.ts` | Fix stale closure in retry polling with ref |
| `src/components/Web3/WalletButton.tsx` | Add navigation to /fun-wallet on FUN Wallet select |
| `src/hooks/useWalletConnection.ts` | Fix cancel wallet change state + stabilize switchToBSC |

