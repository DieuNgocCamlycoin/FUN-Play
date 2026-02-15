

# Reset All Suspicious Short Durations to NULL

## Problem

The Shorts tab currently shows ~170 videos with durations between 61-180 seconds. Most of these are actually long videos (spiritual lectures, meditation sessions, Buddhist teachings) that were incorrectly tagged with short durations due to the upload bug. This makes the Shorts tab full of misclassified long content.

## Solution

### Database Update: Reset ALL durations 180 seconds or less to NULL

```text
UPDATE videos 
SET duration = NULL 
WHERE duration IS NOT NULL 
  AND duration <= 180;
```

This will:
- Move all ~170 misclassified videos from Shorts tab to Videos tab
- The self-healing mechanism will automatically detect and save the correct duration when each video is played
- Videos that are genuinely short (under 3 minutes) will be re-classified back into Shorts once their real duration is confirmed by the player

### No Code Changes Needed

Both `YourVideosMobile.tsx` and `ProfileVideosTab.tsx` already use the correct classification logic:
- **Shorts**: `duration IS NOT NULL AND duration <= 180`
- **Videos**: `duration > 180 OR duration IS NULL`

## Files Changed

| File | Change |
|------|--------|
| Database only | Reset `duration` to NULL for all videos with duration between 1-180s |

## Expected Result

- Shorts tab will be empty initially (until self-healing re-detects real durations)
- Videos tab shows all content correctly
- As users watch videos, the player auto-detects real durations and genuinely short videos will reappear in the Shorts tab with accurate metadata

