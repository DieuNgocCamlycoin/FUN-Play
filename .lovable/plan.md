

# Fix Double-Dispatch Bug and Verify View Reward System

## Problem Found

There is a **double event dispatch** bug causing the `camly-reward` event to fire TWICE per reward:

1. **First dispatch**: Inside `useAutoReward.ts` `awardCAMLY()` function (line 57-63) -- this fires for ALL reward types automatically
2. **Second dispatch**: Inside each video player (`EnhancedVideoPlayer`, `YouTubeMobilePlayer`, `MobileVideoPlayer`) after calling `awardViewReward()` which calls `awardCAMLY()`

This means:
- Toast notification shows **twice** ("+5,000 CAMLY" appears 2 times)
- RewardHistory page refreshes **twice** unnecessarily
- Upload.tsx also double-dispatches for upload rewards

## Current State (Already Correct)

These items are already properly configured:
- DB `VIEW_REWARD = 5000` (confirmed)
- Client constant `VIEW: 5000` in `enhancedRewards.ts`
- `awardViewReward()` returns `RewardResult` with amount
- 30% threshold in all 3 players
- Dependencies: `[isPlaying, viewRewarded, user, videoId, awardViewReward]` (no `currentTime`)
- Edge function default `VIEW: 5000`

## Fix Required

### File 1: `src/components/Video/EnhancedVideoPlayer.tsx`
Remove the duplicate `window.dispatchEvent` call. Since `awardCAMLY()` already dispatches the event internally, the player should NOT dispatch it again.

**Before:**
```tsx
const result = await awardViewReward(videoId);
if (result.success) {
  window.dispatchEvent(new CustomEvent("camly-reward", {
    detail: { type: "VIEW", amount: result.amount || 5000 }
  }));
}
```

**After:**
```tsx
const result = await awardViewReward(videoId);
if (result.success) {
  console.log('[Desktop Reward] View reward awarded:', result.amount);
}
```

### File 2: `src/components/Video/YouTubeMobilePlayer.tsx`
Same fix -- remove duplicate dispatch.

### File 3: `src/components/Video/MobileVideoPlayer.tsx`
Same fix -- remove duplicate dispatch.

### File 4: `src/pages/Upload.tsx`
Same fix -- remove duplicate dispatches for FIRST_UPLOAD and SHORT/LONG_VIDEO_UPLOAD (since `awardCAMLY` already dispatches).

## Summary

| Item | Status |
|------|--------|
| DB VIEW_REWARD = 5000 | Already correct |
| Client VIEW = 5000 | Already correct |
| 30% threshold all players | Already correct |
| Interval deps (no currentTime) | Already correct |
| awardViewReward returns RewardResult | Already correct |
| Double event dispatch | **BUG -- needs fix** |

## Expected Result
- User watches any video to 30%, receives exactly 5,000 CAMLY
- Toast notification shows "+5,000 CAMLY" exactly ONCE
- Reward history page updates once via the single event from `awardCAMLY()`
- Works identically on desktop and mobile
