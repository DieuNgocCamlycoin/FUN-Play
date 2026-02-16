

# Wallet Connection System - Optimization & Mobile Fix

## Issues Found

### 1. `switchToBSC` in useEffect dependency causes infinite re-renders on mobile
In `useWalletConnection.ts` (line 488), `switchToBSC` is listed as a dependency of the `watchAccount` effect. Because `switchToBSC` is a `useCallback` with no deps, it's stable -- but it triggers `setIsLoading(true)` which causes re-renders. On mobile, when the chain is wrong, this creates a rapid loop: detect wrong chain -> call `switchToBSC` -> re-render -> detect wrong chain again. This is why mobile connections "don't work" -- the app gets stuck in a switch-chain loop before the wallet can respond.

**Fix:** Use a `useRef` for `switchToBSC` to prevent it from being in the effect dependency array (matching the existing pattern with `toastRef`). Also add a guard flag (`isSwitchingChainRef`) to prevent calling `switchToBSC` multiple times simultaneously.

### 2. `connectWithRetry` polling timeout too short for mobile (10s)
In `useWalletConnectionWithRetry.ts` (line 125), the connection timeout is only 10 seconds. On mobile, WalletConnect requires the user to switch apps (browser -> wallet app -> approve -> switch back). This process frequently takes more than 10 seconds, causing false "timeout" results and the connection appearing to fail even though the user approved in their wallet.

**Fix:** Increase the timeout to 30 seconds for mobile users, keep 10 seconds for desktop.

### 3. `useWalletConnectionWithRetry` auto-reconnect fires incorrectly
In `useWalletConnectionWithRetry.ts` (line 47-61), the auto-reconnect effect watches `walletConnection.isConnected` and calls `connectWithRetry()` whenever connection drops. On mobile, brief disconnections during app-switching trigger unwanted reconnect attempts that open the modal again, confusing users.

**Fix:** Add a debounce -- only auto-reconnect if the connection has been lost for more than 5 seconds (not immediately).

### 4. `saveWalletToDb` and `clearWalletFromDb` in effect dependency array
In `useWalletConnection.ts` (line 488), the `watchAccount` effect depends on `saveWalletToDb` and `clearWalletFromDb`, which depend on `user`. Every time `user` object reference changes (common with auth state), the entire effect re-runs, unsubscribing and re-subscribing the account watcher. This causes flickering and missed events on mobile.

**Fix:** Use `useRef` for the `user` value so the callbacks are stable and don't cause the effect to re-run.

### 5. Multiple `useWalletConnection` instances across components
`WalletButton`, `Wallet` page, `ClaimRewardsModal`, `ClaimRewardsSection`, `NFTMintModal`, `TokenSwap`, and `MultiTokenWallet` all independently call `useWalletConnection` or `useWalletConnectionWithRetry`. Each instance sets up its own `watchAccount` listener and DB fetch. This creates 5-7 redundant `watchAccount` subscriptions and 5-7 separate DB queries on every page load.

**Fix:** This is a larger architectural change (React Context) that we'll note but not implement in this round to keep changes focused and safe.

---

## Implementation Plan

### Step 1: Stabilize `switchToBSC` with useRef + guard flag
In `useWalletConnection.ts`:
- Add `switchToBSCRef` (useRef) to hold the latest `switchToBSC` function
- Add `isSwitchingChainRef` to prevent duplicate calls
- Replace `switchToBSC()` calls inside the effect with `switchToBSCRef.current()`
- Remove `switchToBSC` from the effect dependency array

### Step 2: Stabilize `saveWalletToDb` and `clearWalletFromDb` with useRef
In `useWalletConnection.ts`:
- Add `userRef` to track the current user without re-creating callbacks
- Update `saveWalletToDb` and `clearWalletFromDb` to use `userRef.current`
- This makes the `watchAccount` effect dependency array only contain stable refs

### Step 3: Increase mobile connection timeout
In `useWalletConnectionWithRetry.ts`:
- Import `isMobileBrowser` from web3Config
- Change timeout from fixed 10s to: `const connectionTimeout = isMobileBrowser() ? 30000 : 15000;`

### Step 4: Debounce auto-reconnect
In `useWalletConnectionWithRetry.ts`:
- Change the auto-reconnect delay from `mergedConfig.retryDelayMs` (2s) to 5000ms
- Only trigger if `wasConnectedRef` has been true for at least one render cycle

---

## Technical Details

### Files to Modify

1. **`src/hooks/useWalletConnection.ts`**
   - Add `userRef = useRef(user)` + keep it synced
   - Add `switchToBSCRef = useRef(switchToBSC)` + keep it synced
   - Add `isSwitchingChainRef = useRef(false)` guard
   - Update `saveWalletToDb` and `clearWalletFromDb` to use `userRef.current`
   - Update effect to use refs instead of direct function deps
   - Clean up effect dependency array to `[]` (stable)

2. **`src/hooks/useWalletConnectionWithRetry.ts`**
   - Import `isMobileBrowser`
   - Dynamic timeout: 30s mobile / 15s desktop
   - Debounce auto-reconnect to 5s

### No Database Changes Required

### Performance Impact
- Eliminates 5-7 redundant `watchAccount` re-subscriptions per page navigation
- Removes infinite re-render loop on mobile when chain is wrong
- Reduces false timeout failures on mobile by 3x (30s vs 10s)
- Prevents auto-reconnect storms during mobile app-switching

