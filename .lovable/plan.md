
# Fix Claim CAMLY Chat Messages and Notifications

## Problem Summary

When users successfully claim CAMLY coins, neither chat messages from Fun Pay Treasurer nor proper notifications appear. The root cause is a bug in the backend function, and the frontend needs updates to properly display claim-related messages.

## Issues Found

### Issue 1: Chat message creation fails silently (Backend Bug)
The `claim-camly` backend function uses `.single()` when searching for an existing chat with the Treasurer. This method throws an error when no chat exists (first-time claim), which gets caught silently. As a result, no chat is ever created and no message is sent.

**Fix**: Change `.single()` to `.maybeSingle()` -- this returns `null` instead of throwing an error when no row is found, allowing the code to proceed to create a new chat.

### Issue 2: System messages render as plain centered pills (Frontend)
The claim chat message uses `message_type: "system"`, which renders as a tiny centered gray pill (designed for "User joined" style messages). Donation messages use `message_type: "donation"` and render as rich cards with buttons and links.

**Fix**: Change the claim message type to `"donation"` in the backend, or add a new claim-specific card rendering in `ChatMessageItem`. Since the donation card already supports `deep_link` (BSCScan URL) and rich display, using `message_type: "donation"` is the simplest approach -- consistent with the gift transfer flow.

### Issue 3: Notification filter doesn't show claim notifications
The Notifications page has filter tabs: "All", "Comments", "Subscriptions", "Rewards". Claim notifications use `type: "claim_success"` which only appears under "All". Users filtering by "Rewards" won't see claim notifications.

**Fix**: Add a "Claim" tab or include `claim_success` in the "Rewards" filter logic.

## Solution

### File 1: `supabase/functions/claim-camly/index.ts`
- Change `.single()` to `.maybeSingle()` on the existing chat query (line 384)
- Change `message_type: 'system'` to `message_type: 'donation'` for richer display
- Add a claim receipt link using the claim request ID as deep_link (e.g., `/receipt/claim-{claimId}`)

### File 2: `src/pages/Notifications.tsx`
- Update the filter logic so "Rewards" tab also matches `claim_success` type notifications
- This ensures claim notifications are visible in both "All" and "Rewards" filter tabs

### File 3: `src/components/Chat/ChatMessageItem.tsx`
- No changes needed -- donation message type already renders with `ChatDonationCard` which shows the BSCScan link button and rich card styling

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/claim-camly/index.ts` | Fix `.single()` to `.maybeSingle()`, change message_type to "donation", add receipt deep_link |
| `src/pages/Notifications.tsx` | Include `claim_success` in "Rewards" filter tab |

## Execution Order
1. Fix the backend function (`.maybeSingle()` + message_type change)
2. Update notification filter on frontend
3. Deploy and test with a claim transaction
