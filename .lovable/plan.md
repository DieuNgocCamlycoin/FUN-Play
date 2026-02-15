

# Fix Long Videos Appearing in Shorts Tab

## Root Cause

The filtering logic in `ProfileVideosTab.tsx` is **correct** -- shorts are defined as `duration <= 180s` and videos as `duration > 180s OR duration IS NULL`.

However, the **database has incorrect duration values** for many videos. For example:
- "8 CAU THAN CHU CUA CHA (1)" has `duration = 8` in the DB, but the actual video is 4:01 (241 seconds)
- Many videos have stored durations of 3-10 seconds when they are actually much longer

The current auto-duration detection in `Watch.tsx` only corrects videos with `duration = NULL`. It does NOT fix videos that already have an incorrect (too-short) stored duration.

## Solution

### 1. Expand auto-duration correction in Watch.tsx

Change the condition from `data.duration == null` to also detect mismatches. When the player loads metadata, compare the actual duration against the stored value. If they differ significantly (e.g., actual is more than 2x the stored value), update the DB.

This will self-heal incorrect durations as users watch the videos.

### 2. Also add the same correction to YouTubeMobilePlayer

Since the user is on mobile, ensure the mobile player also triggers duration corrections. Add a callback or use the existing `onTimeUpdate` to detect and fix mismatches.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Watch.tsx` | Expand auto-duration detection from NULL-only to also fix significant mismatches (stored vs actual) |
| `src/components/Video/YouTubeMobilePlayer.tsx` | Add duration mismatch auto-correction when metadata loads |

## Technical Details

```text
// Watch.tsx - Expanded auto-detect (line ~257)
// Before: only triggers when data.duration == null
// After: also triggers when stored duration differs significantly from actual

const storedDuration = data.duration;
const videoEl = document.createElement("video");
videoEl.preload = "metadata";
videoEl.src = data.video_url;
videoEl.onloadedmetadata = async () => {
  const actual = videoEl.duration;
  if (actual && actual > 0 && isFinite(actual)) {
    const rounded = Math.round(actual);
    // Update if NULL or if mismatch is significant (>30% difference)
    const needsUpdate = storedDuration == null 
      || Math.abs(rounded - storedDuration) / Math.max(rounded, 1) > 0.3;
    if (needsUpdate) {
      await supabase
        .from("videos")
        .update({ duration: rounded })
        .eq("id", data.id);
    }
  }
  videoEl.src = "";
};
```

```text
// YouTubeMobilePlayer.tsx - Add duration correction on loadedmetadata
// When the video element fires loadedmetadata, compare with stored duration
// and update DB if there's a significant mismatch
```

This approach ensures:
- Videos with wrong durations get auto-corrected when anyone watches them
- Works on both desktop and mobile players
- Once corrected, the video will appear in the correct tab (Video vs Shorts)
- No manual data migration needed -- corrections happen organically

