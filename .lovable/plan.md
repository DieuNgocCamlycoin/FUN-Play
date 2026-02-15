

# Fix Short/Long Video Sorting on Profile Page

## Problem

1. **Wrong durations still in database**: The previous fix only reset videos with `duration <= 10` to NULL. But many videos with durations of 11-15 seconds are also incorrect (e.g., "8 CAU THAN CHU CUA CHA" stored as 12s when it's actually 4+ minutes). These still show up in the Shorts tab incorrectly.

2. **Shorts tab layout doesn't match YouTube**: Currently both Videos and Shorts tabs use the same horizontal video card layout. On YouTube mobile, Shorts are displayed in a compact vertical grid (3 columns, portrait aspect ratio thumbnails).

## Solution

### 1. Database Migration: Reset suspicious durations (11-15s) to NULL

Expand the previous reset to also clear durations between 11 and 15 seconds. These are almost always incorrect metadata captures from upload. Real shorts are typically 20+ seconds.

```text
UPDATE videos 
SET duration = NULL 
WHERE duration IS NOT NULL 
  AND duration > 10 
  AND duration <= 15;
```

This immediately moves these misclassified videos out of the Shorts tab and into the Videos tab (where NULL durations go). The self-healing mechanism will set the correct duration when they are played.

### 2. Update Shorts tab layout in ProfileVideosTab

When `type === "shorts"`, render a YouTube-style vertical grid instead of the standard video card grid:
- **Mobile**: 3 columns with portrait (9:16) aspect ratio thumbnails
- **Desktop**: 4-6 columns
- Compact card with just thumbnail, title, and view count (no channel name or avatar needed on own profile)
- Clicking navigates to `/shorts` page or `/watch/{id}`

### 3. Add Shorts-specific card rendering

Inside `ProfileVideosTab.tsx`, add a conditional render path for shorts that shows:
- Portrait thumbnail (aspect-[9/16]) 
- Title (1 line, truncated)
- View count
- No duration badge (shorts don't need it)

## Files Changed

| File | Change |
|------|--------|
| SQL Migration | Reset `duration` to NULL for videos with duration 11-15s |
| `src/components/Profile/ProfileVideosTab.tsx` | Add shorts-specific grid layout with portrait cards matching YouTube mobile style |

## Technical Details

```text
// ProfileVideosTab.tsx - Shorts grid layout
if (type === "shorts") {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
      {videos.map((video) => (
        <div key={video.id} className="cursor-pointer" onClick={() => navigate(`/watch/${video.id}`)}>
          <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted">
            <img src={video.thumbnail_url} className="w-full h-full object-cover" />
          </div>
          <p className="text-xs mt-1 line-clamp-1">{video.title}</p>
          <p className="text-xs text-muted-foreground">{formatViews(video.view_count)}</p>
        </div>
      ))}
    </div>
  );
}
```

## Expected Result

- Videos with wrong 11-15s durations immediately disappear from Shorts tab
- Shorts tab displays in a compact 3-column portrait grid like YouTube mobile
- Videos tab shows only long videos and undetected (NULL duration) videos
- Self-healing continues to permanently fix durations when videos are played
