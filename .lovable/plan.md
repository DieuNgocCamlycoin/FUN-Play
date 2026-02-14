

# Add Chat Message and Notification for Successful CAMLY Claims

## Problem
When a user successfully claims CAMLY coins, there is:
1. **No chat message** from a system account (like "Fun Pay Treasurer") informing the user
2. **No notification** in the notifications page

This is inconsistent with the gift/donation flow, which sends both a chat message (message_type: "donation") and a notification entry upon success.

## Solution

### 1. Create a "Fun Pay Treasurer" System Profile
A system profile needs to exist in the `profiles` table so it can be the `sender_id` for chat messages. This will be created via a database migration with a fixed UUID.

### 2. Update the `claim-camly` Edge Function
After a successful blockchain transaction (after line 368 in the current code), add two operations using the admin Supabase client:

**A. Send a chat message:**
- Find or create a `user_chats` entry between the system account and the claiming user
- Insert a `chat_messages` record with:
  - `sender_id`: Fun Pay Treasurer system UUID
  - `message_type`: "system"
  - `content`: "You just claimed X CAMLY successfully! Tx: [hash]"
  - `deep_link`: link to BSCScan transaction or claim receipt

**B. Insert a notification:**
- Insert into `notifications` table with:
  - `user_id`: the claiming user
  - `type`: "claim_success"
  - `title`: "CAMLY Claim successful!"
  - `message`: amount + tx info
  - `link`: link to claim receipt or BSCScan
  - `actor_id`: Fun Pay Treasurer system UUID

### 3. No Frontend Changes Needed
- The chat sidebar (`useChats`) already listens to realtime changes on `chat_messages` -- messages from Fun Pay Treasurer will appear automatically
- The notifications page already listens to realtime `INSERT` events on the `notifications` table -- new claim notifications will appear automatically
- `GlobalPaymentNotifications` already monitors `wallet_transactions` for received payments

## Technical Details

### Database Migration
```sql
-- Create Fun Pay Treasurer system profile
INSERT INTO profiles (id, username, display_name, avatar_url)
VALUES (
  'f0f0f0f0-0000-0000-0000-000000000001',
  'fun_pay_treasurer',
  'Fun Pay Treasurer',
  '/images/camly-coin.png'
) ON CONFLICT (id) DO NOTHING;
```

### Edge Function Changes (`supabase/functions/claim-camly/index.ts`)
After the daily claim record update (line ~367), add:

1. **Chat message block**: Find/create user_chats between treasurer and user, then insert chat_messages with claim details
2. **Notification block**: Insert into notifications table

Both operations use `supabaseAdmin` (service role) so RLS is bypassed -- this is necessary because the system account is not an authenticated user.

### Files Changed
| File | Change |
|------|--------|
| Database migration (SQL) | Create Fun Pay Treasurer system profile |
| `supabase/functions/claim-camly/index.ts` | Add chat message + notification after successful claim |

No frontend files need modification -- the existing realtime listeners will pick up the new messages and notifications automatically.

