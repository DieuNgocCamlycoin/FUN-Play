
# Fix: Prevent Double Claiming + Reset Balance to Zero + Add Claim Receipt Card

## Problem 1: Users Can Claim Again After Successful Claim

**Root Cause**: In `supabase/functions/claim-camly/index.ts` (lines 359-371), after a successful claim, the system only **subtracts** `claimAmount` from `approved_reward`. If the user had more approved rewards than the daily/lifetime cap allowed, there's a remaining balance that lets them click Claim again.

**Fix**: After a successful claim, reset `approved_reward` to **0** and mark **ALL** approved unclaimed reward_transactions as `claimed`. This ensures no leftover balance triggers a second claim attempt.

Additionally, add a **client-side ref guard** in `ClaimRewardsModal.tsx` to prevent rapid double-clicks from sending multiple requests before the first one completes (the `claiming` state already does this, but a ref provides an extra layer).

## Problem 2: Add Receipt Card for Claim Transactions

Currently, only donation transactions show a "Xem Card" button linking to `/receipt/:id`. Claim transactions (source_table = "claim_requests") have no receipt card.

**Fix**: Add a "Xem Biên Nhận" (View Receipt) button on claim transaction cards in the TransactionCard component. This will link to a new claim receipt view that displays the claim details in a shareable, social-media-friendly format.

---

## Technical Changes

### 1. Edge Function: `supabase/functions/claim-camly/index.ts`

**Lines 326-371** -- Replace the partial marking logic with full reset:

- Mark **ALL** `unclaimedRewards` as `claimed` (not just up to `claimAmount`)
- Set `approved_reward = 0` on the user's profile (not `currentApproved - claimAmount`)
- This prevents any leftover balance from allowing a second claim

### 2. Frontend: `src/components/Transactions/TransactionCard.tsx`

**Lines 274-284** -- Add a receipt button for claim transactions:

- Add a condition for `transaction.source_table === "claim_requests"` alongside the existing donation check
- Link to `/receipt/claim-${transaction.id}` for claim transactions
- Style with a green theme (matching the claim color scheme)

### 3. New Component: Claim Receipt Card

Create a shareable receipt card that displays:
- FUN PLAY branding with logo
- Claim amount in large text
- Wallet address (sender: Treasury, receiver: User)
- Transaction hash with BscScan link
- Date and time
- Share button for social media
- Styled with gradients for a premium, screenshot-worthy look

This will be handled within the existing Receipt page by detecting claim-type receipts and rendering a different layout.

### 4. Frontend: `src/components/Rewards/ClaimRewardsModal.tsx`

**Line 188-274** -- Add a `useRef` guard to `handleClaim`:

- `const claimInProgressRef = useRef(false)` to block concurrent calls
- Check `if (claimInProgressRef.current) return` at the start of `handleClaim`
- Set it to `true` before the API call and `false` in `finally`
- After success, also call `fetchUnclaimedRewards()` to refresh the balance immediately

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/claim-camly/index.ts` | Reset approved_reward to 0, mark all rewards as claimed |
| `src/components/Rewards/ClaimRewardsModal.tsx` | Add ref guard against double-clicks |
| `src/components/Transactions/TransactionCard.tsx` | Add receipt button for claim transactions |
| `src/pages/Receipt.tsx` | Handle claim receipt type with shareable card design |
