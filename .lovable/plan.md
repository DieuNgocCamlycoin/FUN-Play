

# Fix Claim Messaging and Notifications to Match Gift Transactions

## Current Gaps (Claim vs Gift)

| Feature | Gift Transaction | Claim Transaction |
|---------|-----------------|-------------------|
| donation_transactions record | Created on frontend | Created in edge function (correct) |
| Chat message with donation_transaction_id | Passed correctly | Passed correctly |
| Notification metadata | Includes transaction_id, receipt_public_id, theme, amount, token_symbol | Missing entirely |
| Notification link | Internal `/receipt/{id}` | Internal (correct) |
| Notification type in filter | `gift_received` -- NOT in "Rewards" tab | `claim_success` -- in "Rewards" tab |
| Treasurer avatar | null -- shows fallback "F" letter | Needs a proper avatar URL |
| Mobile card width | Fixed 320px -- may overflow on small screens | Same issue |
| Notification action_type | `share_celebration` for gift approval | Missing for claims |

## Changes

### 1. Backend: `supabase/functions/claim-camly/index.ts`

**Add metadata to claim notification** (to match gift notification format):

Update the notification insert (around line 484) to include `metadata` with transaction details:
- `metadata.transaction_id`: the donation_transactions ID
- `metadata.receipt_public_id`: for deep linking
- `metadata.amount` and `metadata.token_symbol`

This makes claim notifications data-rich like gift notifications.

### 2. Frontend: `src/pages/Notifications.tsx`

**Include `gift_received` in the "Rewards" filter tab**:

Currently line 134 only matches `reward` and `claim_success`. Gift notifications use type `gift_received` which only shows under "All". Update the filter to:

```
n.type === "reward" || n.type === "claim_success" || n.type === "gift_received"
```

### 3. Frontend: `src/components/Chat/ChatDonationCard.tsx`

**Mobile responsive improvements**:
- Change `max-w-[320px]` to `max-w-[280px] sm:max-w-[320px]` so the card fits better on small screens (iPhone SE = 320px viewport)
- Reduce avatar sizes from `h-12 w-12` to `h-10 w-10 sm:h-12 sm:w-12` for mobile
- Make the amount text slightly smaller on mobile: `text-base sm:text-lg`

### 4. Database: Update Treasurer avatar

Set a proper avatar for the Treasurer profile so the card doesn't show a plain "F" fallback. Use the platform logo from the public directory.

```sql
UPDATE profiles 
SET avatar_url = '/images/logo.png'
WHERE id = 'f0f0f0f0-0000-0000-0000-000000000001' 
  AND avatar_url IS NULL;
```

## Execution Order

1. Update Treasurer avatar in database
2. Update claim-camly edge function (add metadata to notification)
3. Update Notifications.tsx (add gift_received to Rewards filter)
4. Update ChatDonationCard.tsx (mobile responsive)
5. Redeploy edge function

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/claim-camly/index.ts` | Add metadata to notification insert |
| `src/pages/Notifications.tsx` | Include `gift_received` in Rewards filter |
| `src/components/Chat/ChatDonationCard.tsx` | Mobile responsive sizing |
| Database | Treasurer avatar_url update |

