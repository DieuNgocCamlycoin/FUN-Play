
# Claim System Final Polish

## Current Status: Healthy
- 91 successful claims, 37.5M CAMLY distributed
- Error mapping, atomic updates, fire-and-forget tasks all working
- No recent errors in logs

## Remaining Issues

### 1. Clean 21 old failed records from pre-fix era (Feb 11-13)
These are auto-timeouts, stuck claim cleanups, and "Admin wallet not configured" errors from before the system was properly set up. They clutter admin views.

### 2. Redundant error mapping in frontend
The edge function now returns friendly Vietnamese messages (via `mapErrorToFriendly`), but `ClaimRewardsModal.tsx` lines 377-386 still re-map the same errors client-side. This is dead code since the edge function already handles it. The frontend catch block should just display whatever message comes back from the server.

### 3. Edge function catch block creates redundant Supabase clients  
The catch block (lines 324-337) creates 2 new Supabase clients (`adminClient` and `tempAuth`) to clean up failed claims. This wastes resources. Instead, move the `supabaseAdmin` and user ID extraction above the try block so they can be reused in catch.

### 4. Unused imports in ClaimRewardsModal
- `REWARD_WALLET_ADDRESS` imported but never used
- `isMobileLayout` from `useIsMobile()` assigned but never used (the component uses its own `isMobile` state from `isMobileBrowser()`)

## Changes

### File: `supabase/functions/claim-camly/index.ts`
- Move `supabaseAdmin` creation and user authentication above the main try block so the catch block can reuse them instead of creating new clients
- This reduces latency in error paths and removes ~10 lines of redundant code

### File: `src/components/Rewards/ClaimRewardsModal.tsx`
- Remove redundant error re-mapping in catch block (lines 377-386). Simply use the error message as-is since the server already returns friendly messages
- Remove unused `REWARD_WALLET_ADDRESS` import
- Remove unused `isMobileLayout` variable

### Database: Clean 21 old failed records
```sql
UPDATE claim_requests 
SET status = 'cleaned', error_message = 'Auto-cleaned: pre-fix era errors (resolved)'
WHERE status = 'failed';
```

## Technical Details

### Edge function restructure (simplified)

Before:
```text
serve(async (req) => {
  try {
    const supabaseAdmin = createClient(...)  // inside try
    const user = ...                          // inside try
    ... claim logic ...
  } catch {
    const adminClient = createClient(...)     // NEW client in catch (wasteful)
    const tempAuth = createClient(...)        // ANOTHER new client (wasteful)
  }
})
```

After:
```text
serve(async (req) => {
  let supabaseAdmin, userId;                  // declared outside
  try {
    supabaseAdmin = createClient(...)         // created once
    userId = user.id                          // captured once
    ... claim logic ...
  } catch {
    if (supabaseAdmin && userId) {            // reuse existing clients
      await supabaseAdmin.from(...)...
    }
  }
})
```

### Frontend catch simplification

Before (redundant mapping):
```typescript
if (rawMsg.includes("insufficient funds")) {
  errorMessage = "Hệ thống đang bảo trì...";  // server already says this
} else if (rawMsg.includes("reward pool")) {
  errorMessage = "Bể thưởng tạm thời hết...";  // server already says this
} else {
  errorMessage = rawMsg;
}
```

After (trust server messages):
```typescript
let errorMessage = rawMsg || "Không thể claim. Vui lòng thử lại.";
if (rawMsg.includes("pending claim") || rawMsg.includes("đang xử lý")) {
  setHasPendingClaim(true);  // only special case: update UI state
}
```

## Files to Change
1. `supabase/functions/claim-camly/index.ts` -- restructure client creation for catch reuse
2. `src/components/Rewards/ClaimRewardsModal.tsx` -- remove redundant error mapping and unused imports
3. Database cleanup of 21 old failed records
