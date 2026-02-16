

# Wallet Connection - Final Stability & Performance Pass

## Issues Found

### 1. Stale Closure in Auto-Reconnect Effect
In `useWalletConnectionWithRetry.ts` (line 79), the auto-reconnect timer calls `connectWithRetry()`, but `connectWithRetry` is NOT in the effect's dependency array (line 85). This means the auto-reconnect always calls a stale version of the function captured during the first render. On mobile, when auto-reconnect fires after 5 seconds, it may use outdated wallet state.

**Fix:** Store `connectWithRetry` in a ref and call `connectWithRetryRef.current()` inside the timeout.

### 2. `mergedConfig` Recreated Every Render
In `useWalletConnectionWithRetry.ts` (line 21), `{ ...DEFAULT_CONFIG, ...config }` creates a new object on every render. Since `mergedConfig` is in `connectWithRetry`'s dependency array (line 212), this means `connectWithRetry` is **recreated on every single render**, which cascades to `retry` being recreated too. On mobile with frequent re-renders, this adds unnecessary garbage collection pressure.

**Fix:** Memoize `mergedConfig` with `useMemo`.

### 3. Progress Simulation Creates Excessive State Updates
The progress interval (line 107) fires every 300ms and calls `setConnectionProgress()` each time. During a 30-second mobile timeout, that is ~100 state updates just for a visual progress bar. Each update triggers a React re-render of the entire component tree consuming this hook.

**Fix:** Increase interval to 500ms and cap the number of updates.

### 4. `walletConnection.isConnected` in `connectWithRetry` Dependency Array
Line 212 includes `walletConnection.isConnected` as a dependency. Every time connection state toggles, `connectWithRetry` is recreated. But the function already uses `isConnectedRef` for its internal polling (line 150), making the dependency redundant. The early-return guard on line 123 can also use the ref.

**Fix:** Remove `walletConnection.isConnected` from the dependency array; use `isConnectedRef.current` for the guard check.

---

## Implementation Plan

### Step 1: Memoize `mergedConfig`
Replace line 21 with `useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])`. Since `config` defaults to `{}` and is typically not passed, add a stable default ref.

### Step 2: Fix stale closure in auto-reconnect
Add `connectWithRetryRef` and use it in the timeout callback on line 79.

### Step 3: Stabilize `connectWithRetry` dependency array
- Remove `walletConnection.isConnected` from deps (line 212)
- Use `isConnectedRef.current` for the early return guard (line 123)
- Use `mergedConfig` ref or memoized value

### Step 4: Reduce progress simulation frequency
Change interval from 300ms to 500ms and increase step size to compensate.

---

## Technical Details

### Files to Modify

**`src/hooks/useWalletConnectionWithRetry.ts`**
- Add `useMemo` for `mergedConfig`
- Add `connectWithRetryRef` to prevent stale closure in auto-reconnect
- Remove `walletConnection.isConnected` from `connectWithRetry` deps, use `isConnectedRef.current` instead
- Change progress interval from 300ms to 500ms with larger step increments
- Use stable ref for `mergedConfig` in `connectWithRetry`

### No Database Changes Required
### No Other Files Affected

### Performance Impact
- Eliminates `connectWithRetry` recreation on every render (was ~60 recreations/sec during animations)
- Fixes auto-reconnect using stale function reference on mobile
- Reduces progress bar state updates by 40% (from ~100 to ~60 during a 30s timeout)

