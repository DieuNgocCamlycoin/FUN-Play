
# Fix Claim CAMLY Chat Messages and Notifications

## Problem

When users claim CAMLY, the chat message from Fun Pay Treasurer appears as a plain text fallback card instead of the rich Celebration Card seen in gift transactions. This happens because:

1. The claim flow does not create a `donation_transactions` record, so the `ChatDonationCard` component has no data to fetch for the rich card display.
2. The notification link points to an external BSCScan URL instead of an internal receipt page.

## Solution

### Backend: `supabase/functions/claim-camly/index.ts`

**Step 1 - Create a `donation_transactions` record for each successful claim**

After the on-chain transaction succeeds, insert a record into `donation_transactions` (sender = Treasurer, receiver = user), mirroring how gift transactions work. This gives the chat card a `donation_transaction_id` to reference.

Fields:
- `sender_id`: Treasurer ID
- `receiver_id`: User ID
- `token_id`: Look up the CAMLY token from `donate_tokens`
- `amount`: Claim amount
- `chain`: `"bsc"`
- `tx_hash`: The blockchain transaction hash
- `explorer_url`: BSCScan link
- `status`: `"success"`
- `context_type`: `"claim"`
- `message`: Claim success message

**Step 2 - Include `donation_transaction_id` in the chat message insert**

Pass the newly created `donation_transactions.id` so `ChatDonationCard` can fetch and render the full rich card.

**Step 3 - Update notification link**

Change the notification `link` from the BSCScan URL to an internal receipt route: `/receipt/{receipt_public_id}`.

### Frontend: `src/pages/Notifications.tsx`

No additional changes needed beyond the filter fix already applied.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/claim-camly/index.ts` | Create `donation_transactions` record for claims, pass its ID to chat message, update notification link to internal receipt |
