

# Fix Video Classification: Reset All Suspicious Durations and Batch Re-detect

## Problem

Previous fixes only reset durations ≤15 seconds. But the database still has **201 videos** with durations between 16-60 seconds that are almost all incorrectly classified. Examples:
- "8 CAU THAN CHU CUA CHA" stored as 19s, 23s, 34s, 39s (these are 4+ minute videos)
- "Chu Lang Nghiem" stored as 16s (likely much longer)
- Many other spiritual/meditation videos stored as 16-60s

These all show up in the **Shorts** tab incorrectly.

## Root Cause

The upload process captures an unreliable initial duration from the browser's video element before the full file is loaded, resulting in durations that are far too short.

## Solution (2 Steps)

### Step 1: Database Update - Reset all durations ≤ 60s to NULL

Reset all videos with `duration` between 16 and 60 seconds to NULL. Videos in this range on this platform are almost always incorrectly detected -- real shorts tend to be clearly identified by the upload flow, and the vast majority of content is longer spiritual/meditation videos.

```text
UPDATE videos 
SET duration = NULL 
WHERE duration IS NOT NULL 
  AND duration >= 16 
  AND duration <= 60;
```

This immediately moves ~201 misclassified videos out of the Shorts tab.

### Step 2: Batch re-detect durations using existing backend function

The existing `update-video-durations` backend function can parse actual MP4 files to extract correct durations. It currently only processes videos with NULL duration. After Step 1 resets the suspicious ones to NULL, we can call this function (multiple times with limit parameter) to batch-fix all 187 + 201 = ~388 videos with NULL durations.

This will be called via the admin panel or directly, processing 50 videos at a time until all are fixed.

### Step 3: Self-healing continues

For any videos that the batch function can't fix (e.g., non-standard MP4 formats), the existing client-side self-healing code will detect the correct duration when the video is played.

## Files Changed

| File | Change |
|------|--------|
| SQL Data Update | Reset `duration` to NULL for videos with duration 16-60s |
| No code changes needed | The `update-video-durations` function and UI are already correct |

## Expected Result

- All 201 misclassified videos immediately leave the Shorts tab
- Batch duration detection will correctly re-classify them within minutes
- Shorts tab only shows genuinely short videos (real ≤ 180s)
- Videos tab shows everything else correctly
- The YouTube-style portrait grid layout (already deployed) continues working

