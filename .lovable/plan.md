

# Fix Shorts Display Bug and Add Duration Info to Reward History

## Root Cause Analysis

### The Shorts Bug
The Shorts page query on line 405 of `Shorts.tsx` uses:
```
.or('duration.lte.180,category.eq.shorts')
```

This means: show videos where duration <= 180s **OR** category = 'shorts'. The problem is that **8 videos** have `category = 'shorts'` but their actual duration is **longer than 180 seconds** (up to 328 seconds / 5.5 minutes). These were likely uploaded before the duration-based auto-classification was implemented, or users manually checked "Shorts" during upload regardless of actual video length.

Result: Users see these videos in the Shorts feed, but when they play them, the actual video is 3-5 minutes long -- not a Short.

### The same bug exists in 3 other places:
- `ProfileVideosTab.tsx` line 55
- `YourVideos.tsx` line 61

These also include `category.eq.shorts` as a fallback, which leaks long videos into Shorts tabs.

## Fix Plan

### Step 1: Database Fix -- Correct misclassified videos
Update the 8 videos that have `category = 'shorts'` but `duration > 180` to `category = 'general'`. This is the data fix.

Also update the 1 video with `category = 'shorts'` and `NULL` duration -- we cannot confirm it's a Short without duration data.

### Step 2: Fix Shorts.tsx query (line 405)
Change from:
```
.or('duration.lte.180,category.eq.shorts')
```
To:
```
.lte('duration', 180)
```
Only use duration as the source of truth. Videos without duration should not appear in Shorts.

### Step 3: Fix ProfileVideosTab.tsx (line 53-58)
Same fix: use duration as the sole filter, remove `category.eq.shorts` fallback.

### Step 4: Fix YourVideos.tsx (line 59-62)
Same fix for the YouTube Studio tabs.

### Step 5: Fix Upload flows to enforce duration check
In `UploadVideoModal.tsx` (line 505), even if user checks "Shorts", override to `category: 'general'` if duration > 180s. Same for `UploadWizard.tsx` and `UploadContext.tsx`.

### Step 6: Add duration and reward rule info to RewardHistory.tsx

Update the reward history page to show:
- Video duration badge next to video title for upload rewards
- Reward rule explanation line (e.g., "Video ngan <= 3 phut = 20,000 CAMLY")

Changes:
- Add `video_duration` to the `RewardTransaction` interface
- Fetch `duration` alongside `title` from videos table (line 226)
- Map video duration into transaction data
- Display duration badge and reward rule in the transaction item (lines 591-601)
- Import `formatDuration` from `src/lib/formatters.ts`

### Step 7: Add pending status badge
Currently reward history only shows "Da claim" or "Co the claim". Add a "Cho duyet" (pending approval) badge for transactions where `approved = false` and `claimed = false`.

## Files Changed

| File | Change |
|------|--------|
| Database migration | Fix 8+1 videos with wrong category, set to 'general' |
| `src/pages/Shorts.tsx` | Use `duration <= 180` only, remove category fallback |
| `src/components/Profile/ProfileVideosTab.tsx` | Same duration-only filter |
| `src/pages/YourVideos.tsx` | Same duration-only filter |
| `src/components/Video/UploadVideoModal.tsx` | Enforce duration check on category |
| `src/components/Upload/UploadWizard.tsx` | Enforce duration check on category |
| `src/contexts/UploadContext.tsx` | Enforce duration check on category |
| `src/pages/RewardHistory.tsx` | Add duration badge, reward rule info, pending badge |

## Reward Data Verification

Checked all reward transactions against actual video durations: **zero mismatches found**. All SHORT_VIDEO_UPLOAD rewards correctly correspond to videos <= 180s and all LONG_VIDEO_UPLOAD rewards to videos > 180s. No financial corrections needed.

