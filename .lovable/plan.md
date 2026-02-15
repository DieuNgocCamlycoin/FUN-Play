

# Fix Video/Shorts Classification on "Your Videos" Page (Mobile)

## Problem Found

The issue is on the **"Video của bạn" (Your Videos)** page at `/your-videos-mobile`. This page has two bugs:

1. **Videos tab shows ALL videos** -- it fetches every video without filtering by duration, so short videos (Shorts) appear mixed with long videos
2. **Shorts tab is completely empty** -- it's hardcoded to show "Chua co Shorts nao" (No Shorts yet) with no data at all

The correct classification logic already exists in `ProfileVideosTab.tsx` (used on channel/user profile pages), but was never applied to the "Your Videos" page.

## Solution

Update `src/pages/YourVideosMobile.tsx` to properly separate Videos and Shorts using the same YouTube-matching logic:

### 1. Videos Tab -- Filter to show only long videos

Add duration filtering to the database query, splitting videos into two separate lists:
- **Videos**: `duration > 180` OR `duration IS NULL` (long videos + undetected)
- **Shorts**: `duration IS NOT NULL` AND `duration <= 180`

### 2. Shorts Tab -- Show actual short videos

Replace the empty placeholder with a real grid of short videos, using the same YouTube-style portrait layout (aspect-[9/16]) already used in `ProfileVideosTab.tsx`.

### 3. Filter chips work for both tabs

The existing public/private filter chips will continue working for both tabs.

## Technical Details

### File: `src/pages/YourVideosMobile.tsx`

Changes:
- Split the single `videos` state into two: `longVideos` and `shortVideos`
- Update the fetch query to load all videos, then split client-side by duration (since this is the user's own videos, total count is small)
- Videos tab: display `longVideos` (duration > 180 or NULL)
- Shorts tab: display `shortVideos` (duration <= 180, not NULL) in a vertical portrait grid
- Apply the same filter logic (all/public/private) to both tabs

### Classification Logic (matches YouTube)

```text
Shorts: duration IS NOT NULL AND duration <= 180 seconds
Videos: duration > 180 seconds OR duration IS NULL
```

## Expected Result

- Videos tab shows only long videos and videos with unknown duration
- Shorts tab shows short videos in a YouTube-style portrait grid (3 columns on mobile)
- No more mixing of long and short videos
- Filter chips (All/Public/Private) work for both tabs

