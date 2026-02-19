

# Add "Sample Video" Filter to Spam Filter + Verification

## Current State

The Spam Filter has 3 filter tabs: **Reported**, **Short (<90s)**, and **Repetitive**. The upload system already blocks filenames from sample video sites (mixkit, pexels, pixabay, etc.) via `videoUploadValidation.ts`, but videos uploaded before this block was added may still exist in the database. The user's screenshot shows a "mixkit-busy-street-in-the-city-4000-hd..." video that slipped through.

The "Delete Only" button and its RPC `bulk_delete_videos_only` are confirmed working correctly -- code and database function both exist and are properly wired.

## Changes

### 1. Add "Sample Video" Filter Tab to Spam Filter

**File**: `src/components/Admin/tabs/VideosManagementTab.tsx`

- Update the `filter` state type to include `"sample"`: `"short" | "reported" | "repetitive" | "sample"`
- Add a new filter button labeled "Video Mau" (Sample Videos) with an `ExternalLink` icon
- In `fetchSpamVideos()`, when `filter === "sample"`, query all videos and filter client-side by checking if the video title matches any pattern from `BLOCKED_FILENAME_PATTERNS` (imported from `videoUploadValidation.ts`)

Matched patterns: `mixkit`, `pexels`, `pixabay`, `coverr`, `videezy`, `videvo`, `sample-video`, `test-video`, `stock-video`, etc.

### 2. Verification Summary

| System | Status |
|--------|--------|
| Delete Only button | Working -- calls `bulk_delete_videos_only` RPC correctly |
| Delete and Ban button | Working -- calls `bulk_delete_videos_and_ban_users` RPC correctly |
| Hide button | Working -- sets `is_hidden: true` + `approval_status: rejected` |
| Quick Ban (Shield icon) | Working -- calls `ban_user_permanently` RPC |
| Scan Thumbnails | Working -- invokes `scan-thumbnail` edge function |
| Owner tooltip (short/total counts) | Working |
| No dead/unused code found | Clean after previous cleanup |

### Technical Details

- Import `BLOCKED_FILENAME_PATTERNS` from `videoUploadValidation.ts` (need to export it first, as it's currently a private `const`)
- The sample video filter will fetch all videos (limit 200) and filter client-side by title matching against the blocked patterns
- All existing bulk actions (Hide, Delete Only, Delete and Ban) will work with the new filter tab automatically since they operate on the `selected` set

### Files Modified

| File | Change |
|------|--------|
| `src/lib/videoUploadValidation.ts` | Export `BLOCKED_FILENAME_PATTERNS` |
| `src/components/Admin/tabs/VideosManagementTab.tsx` | Add "Sample Video" filter tab with client-side title matching |

