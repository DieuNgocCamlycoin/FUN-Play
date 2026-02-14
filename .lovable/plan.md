

# Fix Claim-CAMLY Edge Function Deployment

## Problem

The `claim-camly` edge function source code is correct but the **deployed version is outdated**. Evidence:

- Two recent `claim_success` notifications (today 07:08 and 05:57) still have `metadata: null`, `action_type: null`, and link to BSCScan instead of internal receipt pages
- Meanwhile, `gift_received` notifications correctly have full metadata
- Edge function logs show "No logs found" -- no claims processed since last deploy attempt

## Root Cause

The CORS headers in the edge function are missing the newer Supabase client platform headers. This can cause silent preflight failures on some clients. The fix is to update the CORS headers to match the standard format, then redeploy.

## Changes

### 1. Update CORS Headers (`supabase/functions/claim-camly/index.ts`, line 6)

**Before:**
```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
```

**After:**
```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
```

### 2. Force Redeploy

Deploy the edge function after the CORS fix to ensure the updated code (rich notifications, Treasurer chat messages, donation_transactions creation) is live.

### Expected Result

Future CAMLY claims will:
1. Create a `donation_transactions` record with `context_type: 'claim'`
2. Send a Treasurer chat message with Celebration Card
3. Insert a notification with `action_type: 'share_celebration'`, rich metadata, and internal `/receipt/{id}` link
4. Appear in the "Rewards" notification filter tab

### Frontend Status (No Changes Needed)

All previous mobile fixes are confirmed live:
- Messages page: `h-dvh` for proper mobile viewport
- Notifications: `min-h-[56px]` touch targets, `active:scale-[0.98]` feedback, `gift_received` in Rewards filter
- Chat donation cards: responsive `max-w-[280px] sm:max-w-[320px]`, scaled avatars/text

