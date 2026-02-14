

# Fix Messaging and Notification: Redeploy Edge Function

## Problem

The `claim-camly` edge function code already contains the correct logic for:
- Creating `donation_transactions` records for claims
- Sending Treasurer chat messages with `donation_transaction_id`
- Inserting rich notifications with `action_type: 'share_celebration'` and `metadata` (transaction_id, receipt_public_id, amount, token_symbol)

However, **the deployed version is outdated**. Database evidence confirms this -- the two most recent `claim_success` notifications (today at 07:08 and 05:57) still have:
- `action_type: null` (should be `share_celebration`)
- `metadata: null` (should contain transaction details)
- `link: https://bscscan.com/tx/...` (should be `/receipt/{id}`)

Meanwhile, `gift_received` notifications from the same period correctly have all metadata populated.

## Previous Frontend Fixes (Already Applied)

These changes from the last edit are already live and working:
- `src/pages/Messages.tsx`: Uses `h-dvh` for proper mobile viewport
- `src/pages/Notifications.tsx`: Has `min-h-[56px]` touch targets and `active:scale-[0.98]` feedback; Rewards filter includes `gift_received`
- `src/components/Chat/ChatMessageItem.tsx`: Has `px-1 sm:px-0` mobile padding
- `src/components/Chat/ChatDonationCard.tsx`: Has responsive `max-w-[280px] sm:max-w-[320px]` and scaled avatars/text

## Action Required

### Step 1: Redeploy `claim-camly` Edge Function
Force redeploy the edge function so the existing code (lines 480-507 with metadata, action_type, and receipt link) takes effect for future claims.

No code changes are needed -- the source code is correct. Only deployment is required.

### Expected Result After Fix

Future CAMLY claims will:
1. Create a `donation_transactions` record with `context_type: 'claim'`
2. Send a Treasurer chat message with the `donation_transaction_id` (rendering a full Celebration Card)
3. Insert a notification with `action_type: 'share_celebration'`, rich metadata, and an internal `/receipt/{id}` link
4. Appear correctly in the "Rewards" notification filter tab

