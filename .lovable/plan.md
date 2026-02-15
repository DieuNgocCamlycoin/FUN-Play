

# Fix Remaining Misclassified Videos in Shorts Tab

## Problem

There are still **13 videos with duration between 5-36 seconds** in the database. These are clearly incorrect durations from the upload bug (e.g., "CHA VU TRU LA TAT CA" at 6s, spiritual videos at 27-36s). They appear in the Shorts tab incorrectly.

Examples of misclassified videos:
- "CHA VU TRU LA TAT CA" -- stored as 6s
- "CHA VU TRU LI XI TET" -- stored as 12s  
- "Mon an bo duong den tu duoc lieu" -- stored as 27s
- "Tam la goc moi phap" -- stored as 36s

## Solution

### Database Update: Reset all durations 60 seconds or less to NULL

```text
UPDATE videos 
SET duration = NULL 
WHERE duration IS NOT NULL 
  AND duration <= 60;
```

This moves 13 misclassified videos from Shorts tab to Videos tab. The self-healing mechanism will detect the correct duration when they are played.

### No Code Changes Needed

The existing code in `ProfileVideosTab.tsx` already has the correct logic:
- **Shorts**: `duration IS NOT NULL AND duration <= 180`
- **Videos**: `duration > 180 OR duration IS NULL`
- YouTube-style portrait grid layout is already deployed

## Files Changed

| File | Change |
|------|--------|
| SQL Data Update | Reset `duration` to NULL for 13 videos with duration 5-60s |

## Expected Result

- 13 misclassified long videos removed from Shorts tab
- Shorts tab shows only videos with durations 61-180s (legitimate short content like music clips)
- Videos tab continues showing long videos and undetected (NULL) videos
- Self-healing fixes durations automatically on playback

