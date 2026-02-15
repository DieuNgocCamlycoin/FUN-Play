
# Fix CAMLY Claim Processing Delays and Stuck Claims

## Root Cause Analysis

I found **3 critical issues** causing the claim form to get stuck:

### Issue 1: 11 Stuck Pending Claims (Including the User in Screenshot)
There are **11 claim requests stuck in "pending" status** since Feb 11-13, including the user "Angel Ngoc Lam" (wallet `0xe5598...5170`) with 255,000 CAMLY stuck since Feb 12. These blockchain transactions failed or timed out, but the status was never updated to "failed."

When these users open the claim modal, it detects the pending claim and shows "Dang xu ly giao dich..." forever -- they can never claim again.

### Issue 2: Auto-Cleanup Only Runs During New Claims
The current auto-cleanup code (which marks pending claims older than 5 minutes as failed) only runs when a user makes a **new** claim attempt. But since the pending claim **blocks** new claims, the cleanup never executes -- creating a deadlock.

### Issue 3: MAX_CLAIM_PER_USER = 500,000 (Lifetime Cap)
The `reward_config` table has `MAX_CLAIM_PER_USER = 500,000`, which is a **lifetime** limit. Once a user has claimed 500K CAMLY total across all time, they can never claim again. 20+ users have already hit this cap. This is separate from the daily limit.

## Fix Plan

### Step 1: Database Cleanup -- Unstick All 11 Pending Claims
Mark all stuck pending claims (older than 10 minutes) as "failed" so affected users can retry immediately.

### Step 2: Update Edge Function -- Auto-Cleanup Before Pending Check
Move the auto-cleanup logic to run **before** the pending claim check, and reduce the timeout from 5 minutes to 2 minutes. This prevents future deadlocks.

### Step 3: Add Client-Side Timeout + Auto-Recovery
Update the ClaimRewardsModal to:
- Add a 90-second client-side timeout for the claim request
- If the edge function hasn't responded in 90 seconds, mark the attempt as timed out and allow retry
- Show a countdown timer so users know the system is working
- Add a "Force Retry" button that appears after 60 seconds

### Step 4: Improve Pending Claim Detection with Auto-Cleanup
When the modal opens and detects a pending claim older than 5 minutes, automatically clean it up client-side by calling a cleanup mechanism, instead of just showing "Processing..." forever.

### Step 5: Increase MAX_CLAIM_PER_USER
Update `reward_config` to set `MAX_CLAIM_PER_USER` to a much higher value (e.g., 10,000,000) so users are not blocked by the lifetime cap. The daily limit of 500,000 already provides sufficient protection.

## Files Changed

| File | Change |
|------|--------|
| Database migration | Clean up 11 stuck pending claims; increase MAX_CLAIM_PER_USER to 10,000,000 |
| `supabase/functions/claim-camly/index.ts` | Move auto-cleanup before pending check; reduce timeout to 2 min |
| `src/components/Rewards/ClaimRewardsModal.tsx` | Add client-side timeout (90s), auto-recovery for stuck pending claims, countdown timer, force retry button |

## Technical Details

### Edge Function Changes (`claim-camly/index.ts`)
- Move the auto-cleanup block (lines 197-208) to run **before** the pending claim check (lines 210-225)
- Reduce cleanup threshold from 5 minutes to 2 minutes
- Add explicit logging when claims are auto-cleaned

### Modal Changes (`ClaimRewardsModal.tsx`)
- In `checkPendingClaims()`: If a pending claim is found that's older than 5 minutes, auto-mark it as failed via a new edge function call or direct update
- Add a `claimTimeout` ref that starts when `handleClaim` is called, and after 90 seconds, resets the claiming state and shows a retry option
- Show elapsed time during claim processing ("Dang xu ly... 15s")
- Add a "Cancel & Retry" button that appears after 30 seconds of processing

### Database Changes
```text
-- Clean up stuck pending claims
UPDATE claim_requests 
SET status = 'failed', 
    error_message = 'Auto-cleanup: stuck pending claim', 
    processed_at = NOW()
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Increase lifetime claim limit
UPDATE reward_config 
SET config_value = '10000000' 
WHERE config_key = 'MAX_CLAIM_PER_USER';
```
