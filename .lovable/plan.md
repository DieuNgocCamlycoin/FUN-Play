

# Delete Videos of Banned Users from Cloudflare R2

## Summary

There are **274 banned users** with **626 videos** totaling **~6.34 GB** stored on Cloudflare R2. Deleting these will free up significant storage space and clean up the platform.

## Approach

Create a new backend function `cleanup-banned-videos` that:
1. Queries all videos belonging to banned users
2. Deletes the actual files (video + thumbnail) from Cloudflare R2
3. Deletes the video records from the database
4. Also cleans up related records (comments, likes, watch history, etc.)
5. Returns a summary report of what was cleaned

The function will process in batches (50 at a time) to avoid timeouts and will be admin-only.

## What Gets Deleted

| Data | Count | Size |
|------|-------|------|
| Video files on R2 | 626 | ~6.34 GB |
| Thumbnail files on R2 | up to 626 | additional savings |
| Video database records | 626 | - |
| Related comments, likes, watch history | varies | - |

## Technical Details

### 1. New Edge Function: `supabase/functions/cleanup-banned-videos/index.ts`

- Admin-only access (verified via `has_role`)
- Extracts R2 object keys from video URLs (format: `{user_id}/videos/{filename}`)
- Uses existing R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`) to send DELETE requests via S3-compatible API
- Processes in batches of 50 videos per invocation to stay within edge function time limits
- Deletes related data in correct order to avoid foreign key issues:
  - `likes` (where video_id matches)
  - `comments` (where video_id matches)
  - `comment_logs` (where video_id matches)
  - `watch_history` (where video_id matches)
  - `content_hashes` (where video_id matches)
  - `reward_actions` (where video_id matches)
  - `video_migrations` (where video_id matches)
  - `playlist_videos` (where video_id matches)
  - `meditation_playlist_videos` (where video_id matches)
  - Finally, the `videos` record itself
- Returns count of deleted videos and freed space

### 2. Admin UI: Add button in `VideosManagementTab.tsx`

- Add a "Cleanup Banned Users' Videos" button in the approval tab or as a new utility
- Shows confirmation dialog with stats (274 users, 626 videos, 6.34 GB)
- Displays progress as batches are processed
- Works on both web and mobile layouts

### 3. Processing Flow

```text
Admin clicks "Cleanup" button
        |
        v
Confirmation dialog (shows stats)
        |
        v
Call edge function (batch of 50)
        |
        v
For each video:
  1. Extract R2 key from URL
  2. DELETE video file from R2
  3. DELETE thumbnail file from R2
  4. Delete related DB records
  5. Delete video record
        |
        v
Return batch results
        |
        v
UI calls again if more remain
        |
        v
Done - show total summary
```

### 4. Safety Measures

- Admin-only: function checks `has_role(admin)` 
- Batch processing: avoids edge function timeout (max 50 per call)
- Uses `service_role` key to bypass RLS for cleanup
- Logs each deletion for audit trail
- Dry-run mode option: pass `dryRun: true` to see what would be deleted without actually deleting

