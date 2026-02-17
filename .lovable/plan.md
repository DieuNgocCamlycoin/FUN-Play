

# Fix Claim Error Display - Return 200 for User-Facing Errors

## Confirmed Status

- Admin wallet: **79,367,000 CAMLY** available (plenty of funds)
- BNB gas: **0.0199 BNB** (sufficient)
- Wallet address: `0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC`

## Root Cause

The Supabase JS client discards response body for non-2xx HTTP status codes. All friendly error messages (Vietnamese) in the edge function are lost and replaced with "Edge Function returned a non-2xx status code".

## Changes

### File 1: `supabase/functions/claim-camly/index.ts`

Change all user-facing error responses from HTTP 400/500/503 to HTTP 200 with `{ success: false, error: "..." }`:

- Line 68-71: "Invalid wallet address" (400 -> 200)
- Line 84-87: "Failed to fetch rewards" (500 -> 200)
- Line 91-94: "No unclaimed rewards" (400 -> 200)
- Line 103-106: "No rewards to claim" (400 -> 200)
- Line 127-132: "Minimum claim amount" (400 -> 200)
- Line 148-151: "Daily limit reached" (400 -> 200)
- Line 168-171: "Lifetime limit reached" (400 -> 200)
- Line 179-182: "Min amount for custom" (400 -> 200)
- Line 184-188: "Exceeds limit for custom" (400 -> 200)
- Line 221-224: "Pending claim exists" (400 -> 200)
- Line 241-243: "Failed to create claim" (500 -> 200)
- Line 256-258: "System not configured" (500 -> 200)
- Line 291-294: "Reward pool unavailable" (503 -> 200)
- Line 510-512: General catch block (500 -> 200)

Keep 401 for auth errors (lines 32-35, 55-58) since those should genuinely block.

### File 2: `src/components/Rewards/ClaimRewardsModal.tsx`

Update `handleClaim` (around lines 344-427):

- After `supabase.functions.invoke()`, check `response.data?.success === false` FIRST
- If `success === false`, use `response.data.error` as the error message
- Keep `response.error` check as fallback for network/auth errors
- The existing friendly message mapping (lines 392-411) will now work correctly since it receives the actual error string

## No Database Changes

## Impact
Users will see clear Vietnamese error messages instead of "Edge Function returned a non-2xx status code".
