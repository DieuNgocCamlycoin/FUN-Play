

# Optimize CAMLY Claim System

## Problem Analysis

After thorough investigation, I found these issues:

### 1. Misleading "Cần 200.000 CAMLY" Button (Critical UX Bug)
In `ClaimRewardsSection.tsx`, the claim button shows "Cần 200.000 CAMLY" even when the user HAS enough CAMLY (e.g., 550K as shown in screenshot). The real blocker is that `avatarVerified` is false or wallet is not connected, but the button text doesn't communicate this. Users think they can't claim when they actually can -- they just need to verify their avatar or connect wallet first.

### 2. Reward Over-Marking Bug (Data Integrity)
In `claim-camly` edge function (lines 352-359), the partial marking logic sorts rewards ascending and marks them until the cumulative total exceeds `claimAmount`. This over-marks rewards. Example: claiming 500K from rewards [2K, 5K, 20K, 70K, 500K] marks ALL 597K worth as claimed, losing 97K for the user.

### 3. `.single()` on daily_claim_records (Edge Function Fragility)
Line 161 uses `.single()` which errors when no daily record exists (first claim of the day). Should use `.maybeSingle()`.

### 4. Valentine's Day Banner (Outdated)
The Valentine's greeting in `ClaimRewardsSection.tsx` is outdated (today is Feb 16).

### 5. Heavy Edge Function
The claim function does blockchain tx + donation record + chat message + notification sequentially. The post-transaction steps (donation, chat, notification) are non-critical and make the function slow.

---

## Implementation Plan

### Step 1: Fix Misleading Button Text (ClaimRewardsSection.tsx)
Update the claim button to show context-specific messages:
- No wallet connected: "Ket noi vi de Claim" (already handled in the if/else, but the inner disabled text is wrong)
- Avatar not uploaded: "Can cap nhat anh dai dien"
- Avatar not verified: "Can xac minh anh chan dung"
- Not enough CAMLY: "Can X CAMLY nua" (current behavior, correct for this case)
- Daily limit reached: "Da dat gioi han hom nay" (already handled)
- Can claim: "CLAIM CAMLY" (already handled)

### Step 2: Fix Reward Over-Marking in Edge Function
Replace the current partial marking logic with accurate tracking:
- Track cumulative amount while iterating
- Stop adding rewards when cumulative would exceed claimAmount
- Only mark rewards that fit within the claim amount

### Step 3: Fix `.single()` to `.maybeSingle()` in Edge Function
Change line 161 of `claim-camly/index.ts` from `.single()` to `.maybeSingle()`.

### Step 4: Remove Valentine's Banner
Remove the Valentine's Day greeting section from `ClaimRewardsSection.tsx` (lines 251-280).

### Step 5: Make Post-Transaction Steps Non-Blocking
Wrap donation_transactions creation, chat message, and notification insertion in a fire-and-forget pattern so the user gets their success response faster after blockchain confirmation.

### Step 6: Improve Pending Claim Recovery
Replace the hacky "send fake wallet address" cleanup in `ClaimRewardsModal.tsx` (lines 119-125) with a direct database check approach -- just re-fetch after a delay instead of invoking the edge function with a dummy address.

---

## Technical Details

### Files to Modify
1. **`src/components/Wallet/ClaimRewardsSection.tsx`** -- Fix button text logic, remove Valentine banner
2. **`supabase/functions/claim-camly/index.ts`** -- Fix `.single()`, fix reward marking, optimize post-tx steps
3. **`src/components/Rewards/ClaimRewardsModal.tsx`** -- Fix pending claim cleanup hack

### Database Changes
None required -- all fixes are code-level.

