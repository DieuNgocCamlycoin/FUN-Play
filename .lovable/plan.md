

# Fix View Reward: 5,000 CAMLY at 30% Watch for ALL Videos

## 3 problems to fix

1. **Interval thrashing bug** -- `currentTime` in useEffect dependencies causes interval to reset every 250ms, so `checkViewReward` never fires reliably
2. **Wrong threshold** -- Currently 60%, user wants **30%** for both short AND long videos
3. **Wrong amount** -- DB has VIEW_REWARD=10,000, hardcoded dispatch uses 10,000, but user wants **5,000 CAMLY**
4. **Long video uses time-based check** -- Currently requires 5 minutes continuous watch. Should use 30% of duration instead (same rule as short videos)

## Changes

### 1. Update DB config: VIEW_REWARD 10,000 to 5,000

### 2. Update client constants
**File**: `src/lib/enhancedRewards.ts`
- `VIEW: 10000` to `VIEW: 5000`

### 3. Fix `awardViewReward` to return full result
**File**: `src/hooks/useAutoReward.ts`
- Change return type from `Promise<boolean>` to `Promise<RewardResult>`
- Return the full result object (with `amount`, `success`, `reason`)

### 4. Fix all 3 players (same pattern for each)
**Files**:
- `src/components/Video/EnhancedVideoPlayer.tsx`
- `src/components/Video/YouTubeMobilePlayer.tsx`
- `src/components/Video/MobileVideoPlayer.tsx`

Changes in each:
- Remove `LONG_VIDEO_MIN_WATCH` constant (no longer needed)
- Remove short/long distinction -- use **30% of duration** for ALL videos
- Read `video.currentTime` and `video.duration` from DOM ref (not React state)
- Remove `currentTime` and `duration` from useEffect dependencies (fixes interval thrashing)
- Use `result.amount` from server response instead of hardcoded 10000

New logic:
```
const checkViewReward = async () => {
  const video = videoRef.current;
  if (!video || viewRewarded || !user || !videoId) return;
  const dur = video.duration;
  if (!dur || dur <= 0) return;
  
  if (video.currentTime >= dur * 0.3) {
    setViewRewarded(true);
    const result = await awardViewReward(videoId);
    if (result.success) {
      window.dispatchEvent(new CustomEvent("camly-reward", {
        detail: { type: "VIEW", amount: result.amount || 5000 }
      }));
    }
  }
};

// Dependencies: only [isPlaying, viewRewarded, user, videoId]
// NO currentTime, NO duration -- read from DOM
```

## Summary

| Item | Before | After |
|------|--------|-------|
| Watch threshold (short) | 60% | **30%** |
| Watch threshold (long) | 5 min continuous | **30% of duration** |
| Reward amount | 10,000 | **5,000** |
| Interval deps | includes currentTime (broken) | excludes it (stable) |
| awardViewReward return | boolean | RewardResult (with amount) |
| DB VIEW_REWARD config | 10,000 | **5,000** |

## Expected Result
- User watches any video to 30% and reliably receives 5,000 CAMLY
- Toast notification shows "+5,000 CAMLY" on both desktop and mobile
- Reward appears immediately in reward history page
- Max 10 rewarded views per day (enforced by edge function)
