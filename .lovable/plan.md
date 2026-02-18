

# Reward System Review: Clean Up Dead Code

## Review Results

All core systems have been verified and are working correctly:
- **Batch updates**: `useRewardBatch.ts` queues VIEW/LIKE/SHARE actions, flushes every 5 min / 10 items / page unload with proper auth headers via `fetch` + `keepalive`
- **Anti-skipping**: All 3 video players (Desktop, Mobile, YouTubeMobile) track `accumulatedWatchTimeRef` using delta <= 2s logic, and send `actualWatchTime` to the server for validation
- **Hard limits**: Both `award-camly` and `batch-award-camly` enforce daily count limits early (fast-path rejection) before loading full config
- **Auto-classification**: `award-camly` reclassifies upload types based on actual video duration from DB (> 180s = LONG, else SHORT)
- **Escrow**: FIRST_UPLOAD rewards are held for 48 hours before release

## One Issue Found: Dead `watchTimeRef` Variable

In all 3 video player components, `watchTimeRef` is declared and reset to 0 on video change, but it is **never read** for any logic. It was the old tracking mechanism that has been fully replaced by `accumulatedWatchTimeRef`.

### Files to clean up:

**1. `src/components/Video/EnhancedVideoPlayer.tsx`**
- Remove `const watchTimeRef = useRef(0);` (line 112)
- Remove `watchTimeRef.current = 0;` (line 162)

**2. `src/components/Video/MobileVideoPlayer.tsx`**
- Remove `const watchTimeRef = useRef(0);` (line 55)
- Remove `watchTimeRef.current = 0;` (line 265)

**3. `src/components/Video/YouTubeMobilePlayer.tsx`**
- Remove `const watchTimeRef = useRef(0);` (line 74)
- Remove `watchTimeRef.current = 0;` (line 351)

## Summary

The reward system is in good shape. The only change needed is removing 6 lines of unused dead code across 3 files. No functional or logic changes required.
