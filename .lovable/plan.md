
# Fix 3 Non-Blocking Bugs in CAMLY Claim System

## Current Status
The automatic claim system is **working correctly**. All claims process successfully with on-chain confirmations. Zero stuck pending claims. The custom amount input feature is functional.

However, 3 non-blocking errors occur after every successful claim, preventing celebration cards, chat messages, and notification sounds from working.

## Bug 1: Donation Transaction Fails (Celebration Card Missing)

**Cause**: The `donation_transactions` table has a check constraint that only allows `context_type` values of `'global'`, `'post'`, `'video'`, `'comment'`. The edge function tries to insert `'claim'`, which is rejected.

**Fix**: Add `'claim'` to the allowed values via database migration:
```text
ALTER TABLE donation_transactions 
DROP CONSTRAINT donation_transactions_context_type_check;

ALTER TABLE donation_transactions 
ADD CONSTRAINT donation_transactions_context_type_check 
CHECK (context_type = ANY (ARRAY['global','post','video','comment','claim']));
```

## Bug 2: Chat Message From Treasurer Fails

**Cause**: The `user_chats` table has a constraint `user1_id < user2_id`. The Treasurer UUID `f0f0f0f0-0000-...` is alphabetically greater than most user UUIDs, so inserting with `user1_id = TREASURER_ID` violates the constraint.

**Fix**: Update the edge function to sort the two IDs before inserting:
```text
// In claim-camly/index.ts, line ~466-469
const [sortedUser1, sortedUser2] = [TREASURER_ID, user.id].sort();
const { data: newChat } = await supabaseAdmin
  .from('user_chats')
  .insert({ user1_id: sortedUser1, user2_id: sortedUser2 })
```

Also update the existing chat lookup query to handle both orderings (already handled by the `.or()` filter).

## Bug 3: Notification Sound Not Playing

**Cause**: The sound URL in the database points to a Supabase storage MP3 file, but the browser reports "no supported source found." The fallback mixkit.co URL also fails.

**Fix**: Update the `useClaimNotificationSound.ts` hook to:
- Add error handling that tries the DB URL first, then a reliable fallback
- Use a known-working notification sound URL as the default fallback

## Files Changed

| File | Change |
|------|--------|
| Database migration | Add `'claim'` to `donation_transactions_context_type_check` constraint |
| `supabase/functions/claim-camly/index.ts` | Sort user IDs before inserting into `user_chats` |
| `src/hooks/useClaimNotificationSound.ts` | Improve fallback sound URL and error handling |

## Technical Details

### Edge Function (`claim-camly/index.ts`)

Lines ~466-469: Fix the chat creation to sort UUIDs:
```text
// Before:
.insert({ user1_id: TREASURER_ID, user2_id: user.id })

// After:
const [u1, u2] = [TREASURER_ID, user.id].sort();
.insert({ user1_id: u1, user2_id: u2 })
```

### Notification Sound Hook (`useClaimNotificationSound.ts`)

Replace the default fallback with a more reliable URL and add a retry mechanism:
- Try DB-configured sound first
- If it fails, try an alternative format/URL
- Gracefully degrade if all audio fails (no crash)

### Database Migration

Single SQL statement to update the check constraint to include `'claim'` as a valid context type.

### No UI/Mobile Changes Needed

The claim modal, amount input, and mobile layout are all working correctly. These fixes are purely backend/edge function corrections that will make the celebration cards and chat notifications appear after claims.
