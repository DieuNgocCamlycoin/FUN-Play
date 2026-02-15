

# Fix Donation Receipt: Correct FUN PLAY TREASURY Display

## Problem

The donation receipt at `/receipt/547f415c4c4c91ff` shows the sender as "Fun Pay Treasurer / @funpay_treasurer" with a generic logo. This is because the `get-donation-receipt` edge function fetches sender info directly from the `profiles` table for user ID `f0f0f0f0-0000-0000-0000-000000000001`, which has outdated data.

The correct display should show **FUN PLAY TREASURY** with its proper avatar, username (`@user_cc9cd3a1`), and branding -- matching the configuration in `src/config/systemWallets.ts`.

## Root Cause

- The `donation_transactions` table stores `sender_id = f0f0f0f0-0000-0000-0000-000000000001` for claim-originated transactions
- The edge function blindly fetches from `profiles` table for this ID, returning stale "Fun Pay Treasurer" data
- No override logic exists for system wallet senders

## Plan

### Step 1: Update Edge Function (`get-donation-receipt/index.ts`)

After fetching sender profile, check if `sender_id` matches the system treasury sender ID (`f0f0f0f0-0000-0000-0000-000000000001`) or if `context_type === "claim"`. If so, override the sender data with correct FUN PLAY TREASURY info:

```text
sender = {
  id: "cc9cd3a1-8541-4f6f-b10e-f5619e0de832",
  username: "user_cc9cd3a1",
  display_name: "FUN PLAY TREASURY",
  avatar_url: "https://pub-348064b6f39043d6be2bfb92d648edb8.r2.dev/cc9cd3a1-8541-4f6f-b10e-f5619e0de832/avatars/1770830879600-play_fun.jpg"
}
```

Also fetch **channel names** for both sender and receiver to display channel name instead of raw username.

### Step 2: Update `DonationReceipt` component in `Receipt.tsx`

For the receiver side, prioritize displaying the **channel name** over the raw username, matching the same pattern used in the claim receipt fix.

### Files Changed

1. `supabase/functions/get-donation-receipt/index.ts` -- Add system treasury override + fetch channel names
2. `src/pages/Receipt.tsx` -- Update `DonationReceipt` to use channel name for receiver display

