

# Fix Reward System Issues and Clean Up

## Issues Found

### 1. CRITICAL: sendBeacon Cannot Send Auth Headers (useRewardBatch.ts)

`navigator.sendBeacon()` does not support custom HTTP headers. The current `handleBeforeUnload` sends the batch payload via `sendBeacon` but the `batch-award-camly` Edge Function requires an `Authorization` header. All rewards queued at page close are silently lost (401 error).

**Fix**: Use `fetch` with `keepalive: true` instead of `sendBeacon`. This allows custom headers while still being reliable during page unload.

```text
// Before (broken):
navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));

// After (working):
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'apikey': anonKey,
  },
  body: JSON.stringify({ actions: globalQueue }),
  keepalive: true,
});
```

**File**: `src/hooks/useRewardBatch.ts` (lines 120-131)

---

### 2. Redundant Admin Client in award-camly (Clean Up)

The Edge Function creates two identical admin Supabase clients:
- `adminSupabaseEarly` at line 208 (used for ban check, rate limit, hard limits)
- `adminSupabase` at line 385 (used for reward logic)

Both use the same `SUPABASE_SERVICE_ROLE_KEY`. This wastes memory and adds confusion.

**Fix**: Remove `adminSupabase` (line 384-385) and rename `adminSupabaseEarly` to `adminSupabase` so one client is reused throughout the function.

**File**: `supabase/functions/award-camly/index.ts` (lines 207-208, 384-385)

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useRewardBatch.ts` | Fix sendBeacon to use fetch with keepalive + auth headers |
| `supabase/functions/award-camly/index.ts` | Remove duplicate admin client, reuse single instance |

Both changes apply to web and mobile equally since the hooks and Edge Functions are shared.

No other issues found -- batch processing, anti-fast-forward, hard limits, video auto-classification, and escrow release are all working correctly as verified by logs and code review.

