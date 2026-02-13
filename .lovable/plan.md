
# Seamless Reward Claim System -- Connecting Admin Approval to User Wallet

## Problem Found

The ClaimRewardsModal shows ALL unclaimed rewards (pending + approved) as "claimable", but the `claim-camly` backend function only sends rewards where `approved = true`. This creates confusion:

- User sees "500,000 CAMLY claimable" but only 200,000 is actually approved
- User clicks Claim, gets an error or receives less than expected
- No visibility into what's "pending admin approval" vs "ready to claim"

The ClaimRewardsSection on the Wallet page correctly reads `approved_reward` from profile, but the modal it opens ignores the approval status.

## Solution

### 1. Fix ClaimRewardsModal Data (Critical Bug Fix)
- Filter rewards by `approved = true` when calculating claimable amount
- Add a separate "Pending Approval" section showing unapproved rewards
- Users clearly see: "X CAMLY ready to claim" vs "Y CAMLY waiting for admin approval"

### 2. Add Pending Rewards Visibility to ClaimRewardsSection
- Show `pendingRewards` stat card alongside approved/claimed stats
- Add a Clock icon card showing "Cho duyet" (Pending) amount so users know rewards are coming

### 3. Ensure ClaimRewardsModal Uses `approved_reward` from Profile
- Use `profiles.approved_reward` as the source of truth for claimable amount (matches what the edge function checks)
- Show reward breakdown split into "Approved" and "Pending" sections

## Technical Changes

### File: `src/components/Rewards/ClaimRewardsModal.tsx`
- Line 122-127: Add `.eq("approved", true)` filter for claimable rewards query
- Add second query for pending (unapproved) rewards to show separately
- Update UI to show two sections: "Co the claim" (green) and "Cho duyet" (amber/yellow)
- Fix the comment "All rewards are auto-approved now" which is incorrect -- rewards require admin approval

### File: `src/components/Wallet/ClaimRewardsSection.tsx`
- Add a 4th stat card showing `pendingRewards` with Clock icon and amber color
- Change grid from 3 columns to 2x2 on mobile for better readability
- Update progress bar to show approved vs threshold (already correct)
- Add note explaining the approval flow: "Rewards are reviewed by admin before you can claim"

### File: `supabase/functions/claim-camly/index.ts`
- No changes needed -- already correctly filters by `approved = true`
- Already resets `approved_reward` to 0 after successful claim

## User Experience After Fix

1. User earns rewards from activities (pending by default)
2. Admin clicks "Duyet Tat Ca" or individual approve on admin page
3. User's wallet page instantly shows updated "Co the Claim" amount (via realtime subscription)
4. User sees clear separation: amber "Cho duyet" vs green "Co the Claim"
5. When approved amount reaches 200,000 CAMLY threshold, Claim button activates
6. User claims -- tokens sent on-chain, balance resets

## Mobile Optimization
- 2x2 grid for stat cards instead of 3 columns (better readability on small screens)
- Clear color coding: amber = pending, green = approved/claimable, blue = claimed
- Touch-friendly button sizes maintained
