

# Fix Video Upload Reward Classification and Compensation

## Root Cause

When users upload videos, the `award-camly` edge function checks the video's `duration` field to classify it as SHORT (<=3 min, 20,000 CAMLY) or LONG (>3 min, 70,000 CAMLY). However, **153 videos** currently have `duration = NULL` in the database because the video metadata hadn't finished processing at upload time. The system defaults these to SHORT, resulting in all uploads showing as "Video ngan" with 20,000 CAMLY -- even for videos that are actually longer than 3 minutes.

## Solution (3 Parts)

### Part 1: Create `update-video-durations` Edge Function (new)

A new backend function that fetches each video file's MP4 metadata to extract the actual duration, then updates the `videos` table. This works by:
- Querying all videos with `duration IS NULL`
- For each video URL, downloading a small portion of the file header (MP4 moov atom) to extract duration
- Updating the `videos.duration` column with the correct value
- Admin-only access, supports batch processing

### Part 2: Enhance `recalculate-upload-rewards` Edge Function (existing)

After durations are populated, this function will:
- Find all `SHORT_VIDEO_UPLOAD` transactions where the video's actual duration > 180 seconds
- Reclassify them to `LONG_VIDEO_UPLOAD` and update amount from 20,000 to 70,000
- Compensate affected users with the 50,000 CAMLY difference via `atomic_increment_reward`
- Already supports dry-run mode for safety

The enhancement adds: **auto-call to `update-video-durations` first**, so it becomes a single operation: detect durations then fix rewards.

### Part 3: Fix Upload Flow to Capture Duration Earlier

Update the upload process in `src/contexts/UploadContext.tsx` and `src/pages/Upload.tsx` to:
- Extract video duration from the file **before** upload completes (using browser's HTMLVideoElement)
- Save duration to the `videos` table immediately during insert, not after
- This prevents future NULL duration issues

### No Display Changes Needed

The reward history page (`RewardHistory.tsx`) already correctly maps:
- `SHORT_VIDEO_UPLOAD` -> "Video ngan" (orange)
- `LONG_VIDEO_UPLOAD` -> "Video dai" (dark orange)

Once the database records are corrected, the display will automatically show the right labels and amounts. The existing Realtime subscription ensures updates appear instantly.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/update-video-durations/index.ts` | **New** - Extract and save video durations from file metadata |
| `supabase/functions/recalculate-upload-rewards/index.ts` | Add auto-duration-detection before reclassification |
| `src/contexts/UploadContext.tsx` | Capture duration from file before database insert |
| `src/pages/Upload.tsx` | Ensure duration is passed during video record creation |

## Execution Steps

1. Deploy `update-video-durations` function
2. Update `recalculate-upload-rewards` to call it first
3. Run recalculation (dry-run first, then apply) to fix all 153 affected videos
4. Fix upload flow to prevent future occurrences
5. Verify reward history shows correct labels in real-time

