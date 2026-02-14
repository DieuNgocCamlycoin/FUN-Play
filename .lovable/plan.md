

# Fix Messaging and Notification Features

## Issues Found

### Critical: Edge Function Not Deployed
The `claim-camly` edge function has no recent logs, meaning the code changes from previous updates (creating donation_transactions, sending chat messages from Treasurer, inserting rich notifications) are NOT executing. This is the root cause of claims not generating messages/notifications like gifts.

**Fix**: Redeploy the `claim-camly` edge function.

### Issue 2: Old Claim Notifications Still Link to BSCScan
Recent claim_success notifications (from today) still have:
- `action_type: null` (should be `share_celebration`)
- `metadata: null` (should contain transaction_id, receipt_public_id, etc.)
- `link: https://bscscan.com/tx/...` (should be `/receipt/{id}`)

This confirms the edge function redeployment is needed.

### Issue 3: Mobile Messages Page Layout
The Messages page uses `h-[calc(100vh-0px)]` which is effectively just `h-screen`. On mobile browsers with dynamic toolbars, `100vh` can cause content to overflow behind the browser chrome. Should use `h-dvh` (dynamic viewport height) or a safer calculation.

### Issue 4: Notifications Page Mobile UX
- The Notifications page does not pass `showBottomNav={false}` to MainLayout, unlike the Messages page. This is inconsistent. However, notifications should keep bottom nav since it's a browsable page.
- The notification items could benefit from better touch targets on mobile (minimum 44px height).

## Plan

### Step 1: Redeploy `claim-camly` Edge Function
No code changes needed -- just trigger redeployment so the existing code (donation_transactions creation, Treasurer chat message, rich notification with metadata) takes effect.

### Step 2: Fix Mobile Messages Height
Update `src/pages/Messages.tsx`:
- Replace `h-[calc(100vh-0px)]` with `h-dvh` for mobile views to handle dynamic browser chrome properly

### Step 3: Improve Mobile Chat Card Interaction
Update `src/components/Chat/ChatMessageItem.tsx`:
- Add proper touch padding for donation cards on mobile

### Step 4: Improve Mobile Notification Touch Targets
Update `src/pages/Notifications.tsx`:
- Increase notification item padding on mobile from `p-3` to `p-3 sm:p-3` with minimum height
- Ensure notification thumbnails scale properly on small screens

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/claim-camly/index.ts` | Redeploy (no code change) |
| `src/pages/Messages.tsx` | Fix mobile viewport height |
| `src/pages/Notifications.tsx` | Mobile touch target improvements |

## Execution Order
1. Redeploy edge function
2. Fix Messages mobile height
3. Improve Notifications mobile UX
