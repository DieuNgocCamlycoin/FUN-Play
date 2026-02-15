
# Add Custom Claim Amount Input to CAMLY Reward System

## Status Check: Claim System is Working

The automatic claim system is fully operational:
- All recent claims completed successfully (no stuck transactions)
- The latest claim: 500,000 CAMLY sent to wallet `0xcBb9...4C2F` on Feb 15 with on-chain confirmation
- Auto-cleanup runs before pending check (deadlock fix confirmed working)
- MAX_CLAIM_PER_USER increased to 10,000,000 (confirmed in logs)

There are two minor non-blocking errors in the donation/chat record creation (check constraint issues), but these do not affect the actual CAMLY transfer to user wallets.

## New Feature: Custom Claim Amount Input

Currently, users can only claim their **entire approved balance** (up to the daily limit). This change adds an input field so users can choose how much to withdraw.

### Changes

#### 1. ClaimRewardsModal.tsx -- Add Amount Input

- Add a new `claimAmount` state with a numeric input field
- Place the input between the balance display and the Claim button
- Include quick-select buttons: "200K", "500K", "Max"
- Validate: minimum 200,000, maximum is the lesser of approved balance or daily remaining limit
- The Claim button text updates to show the selected amount
- Pass `claimAmount` to the edge function

```text
Layout (mobile-first):

+---------------------------+
| Wallet: 0xaBc...1234  [v] |
+---------------------------+
| [Claimable]  [Pending]    |
| 862,000      125,000      |
+---------------------------+
| So luong muon rut (CAMLY) |
| [_______________862,000_] |
| [200K] [300K] [500K] [Max]|
+---------------------------+
| [=== CLAIM 500,000 CAMLY ==] |
+---------------------------+
```

#### 2. Edge Function (claim-camly/index.ts) -- Accept Custom Amount

- Accept optional `claimAmount` in the request body
- If provided, validate it against minimum threshold and daily/lifetime limits
- If not provided, default to current behavior (claim all approved up to limits)
- Adjust reward marking logic to respect the custom amount

### Files Changed

| File | Change |
|------|--------|
| `src/components/Rewards/ClaimRewardsModal.tsx` | Add amount input field with validation, quick-select buttons, responsive layout |
| `supabase/functions/claim-camly/index.ts` | Accept optional `claimAmount` parameter, validate and use it |

### Technical Details

**ClaimRewardsModal.tsx changes:**
- New state: `claimAmount` (number), initialized to `totalClaimable` when data loads
- Input: number type with formatting, min=200000, max=min(totalClaimable, dailyRemaining)
- Quick buttons: preset amounts (200K, 300K, 500K, Max) that set `claimAmount`
- Pass `claimAmount` to edge function: `body: { walletAddress: address, claimAmount }`
- Claim button shows: "Claim {claimAmount} CAMLY" instead of total

**Edge function changes:**
- Parse `claimAmount` from body (optional)
- If provided and valid (>= MIN_CLAIM_AMOUNT, <= totalAmount, <= remainingLimit), use it
- If not provided, use existing logic (min of totalAmount, remainingLimit, lifetimeRemaining)
- All other logic (marking rewards, daily records) remains the same

**Mobile optimization:**
- Quick-select buttons wrap into 2x2 grid on small screens
- Input uses large touch-friendly size (h-12)
- Amount validation shows inline error messages
