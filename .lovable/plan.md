

# Fix Banned Video Cleanup System -- Critical Bug Fix

## Problem

The cleanup function crashes every time with:
```
TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
  at new Set
  at y.in (postgrest-js@2.95.3)
```

The dry-run scan works (shows 344 banned users, 626 videos, ~6.34 GB), but actual deletion always fails. This means **no videos have been cleaned up yet**.

## Root Cause

The postgrest-js v2.95.3 `.in()` method internally calls `new Set(values)` and fails in certain edge function runtime conditions. The code uses `.in('video_id', [video.id])` for single-value lookups (wasteful) and `.in('user_id', bannedUserIds)` with 344 UUIDs (fragile).

## Changes

### 1. Edge Function: `supabase/functions/cleanup-banned-videos/index.ts`

**Bug fixes:**
- Replace all `.in('video_id', [video.id])` with `.eq('video_id', video.id)` -- simpler, avoids `.in()` entirely for single-value deletions
- Replace `.in('user_id', bannedUserIds)` with `.filter('user_id', 'in', '(uuid1,uuid2,...)')` string syntax to bypass the postgrest-js `new Set()` bug
- Same fix for the `remaining` count query and dryRun total count query

**Code cleanup:**
- Remove unused `R2_PUBLIC_URL` variable (line 91)
- Remove unused `publicUrl` parameter from `extractR2Key` function -- it only uses the URL pathname
- Replace `reward_transactions` delete `.eq('video_id', video.id)` (already correct, keep as-is)

**Optimization:**
- Fix dryRun `estimatedSizeBytes` to use a proper aggregate query instead of summing only the first 50 videos

### 2. Frontend: `src/components/Admin/BannedVideoCleanupPanel.tsx`

**Code cleanup:**
- Remove unused `loading` state variable (line 35)

### 3. No changes needed to:
- `VideosManagementTab.tsx` -- integration is clean
- `supabase/config.toml` -- already configured correctly

## Technical Detail

The `.eq()` approach for single-value filters:
```text
BEFORE (broken):  .in('video_id', [video.id])   -- triggers new Set([id]) in postgrest-js
AFTER (fixed):    .eq('video_id', video.id)      -- simple equality, no Set needed
```

The `.filter()` string syntax for large arrays:
```text
BEFORE (broken):  .in('user_id', bannedUserIds)  -- 344 UUIDs passed to new Set()
AFTER (fixed):    .filter('user_id', 'in', '("uuid1","uuid2",...)')  -- raw PostgREST filter string
```

## Result

After this fix:
- The cleanup function will successfully delete 626 videos (~6.34 GB) from R2 storage
- All related database records (comments, likes, watch history, etc.) will be cleaned up
- The admin UI will show accurate progress and storage savings
- No unused code remains

