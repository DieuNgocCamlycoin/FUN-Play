

# Optimize Reward System: Batch Updates, Anti-Skip, Hard Limits, Auto-Classification

## Current State Analysis

The system already has several protections in place:
- **Daily count limits** are enforced server-side in `award-camly` (e.g., 10 views/day, 20 likes/day)
- **Video auto-classification** by duration already works (lines 352-378 in `award-camly`)
- **48-hour escrow** for FIRST_UPLOAD is active
- **View deduplication** exists (60-second window)

However, there are gaps that need fixing:

---

## 1. Batch Update Mechanism (Like/Share/Watch)

**Problem**: Every Like, Share, and View triggers an immediate Edge Function call, creating unnecessary load on the backend.

**Solution**: Implement a client-side reward queue that accumulates actions and flushes them in batches.

### Changes:
- **New file**: `src/hooks/useRewardBatch.ts` - A hook that queues reward actions locally (in-memory array) and flushes them:
  - Every 5 minutes (configurable interval)
  - When the queue reaches 10 items
  - On page unload (`beforeunload` event)
  - On explicit flush call
- **New Edge Function**: `supabase/functions/batch-award-camly/index.ts` - Accepts an array of reward actions and processes them in a single request, reusing the same validation logic from `award-camly`
- **Update**: `src/hooks/useAutoReward.ts` - `awardViewReward`, `awardLikeReward`, `awardShareReward` will push to the batch queue instead of calling the Edge Function immediately
- **Keep immediate**: Upload, Signup, Wallet Connect, Comment rewards remain immediate (they need instant feedback)

### Batch Payload Format:
```text
{
  actions: [
    { type: "VIEW", videoId: "...", timestamp: 1234567890 },
    { type: "LIKE", videoId: "...", timestamp: 1234567891 },
    { type: "SHARE", videoId: "...", timestamp: 1234567892 }
  ]
}
```

---

## 2. Video Fast-Forwarding Prevention

**Problem**: Current logic checks `video.currentTime >= duration * 0.3` which can be cheated by seeking/fast-forwarding to the 30% mark without actually watching.

**Solution**: Track **actual accumulated watch time** (not just playback position) by measuring real elapsed time between `timeupdate` events.

### Changes:
- **Update**: `src/components/Video/EnhancedVideoPlayer.tsx` (Desktop)
  - Track actual watch time: on each `timeupdate`, only count the delta if it's <= 2 seconds (prevents seek jumps from counting)
  - Reward condition changes from `currentTime >= duration * 0.3` to `accumulatedWatchTime >= duration * 0.3`
- **Update**: `src/components/Video/MobileVideoPlayer.tsx` (Mobile)
  - Same accumulated watch time logic
- **Update**: `src/components/Video/YouTubeMobilePlayer.tsx` (YouTube-style mobile)
  - Same accumulated watch time logic
- **Send watch time to server**: Include `actualWatchTime` in the VIEW reward request so the Edge Function can do a server-side sanity check
- **Update**: `supabase/functions/award-camly/index.ts` (or `batch-award-camly`)
  - Accept optional `actualWatchTime` parameter
  - If provided, validate that `actualWatchTime >= videoDuration * 0.3` before granting the reward

---

## 3. Hard Limit (Early Rejection)

**Problem**: The server already checks daily limits, but it does multiple DB queries before rejecting -- loading config, checking bans, etc.

**Solution**: Add a fast-path rejection using a lightweight count check at the very beginning of the Edge Function, before any heavy processing.

### Changes:
- **Update**: `supabase/functions/award-camly/index.ts`
  - Move the daily limit check to immediately after ban check (before loading full reward config)
  - Use a single optimized query: `SELECT view_count, like_count, share_count, comment_count FROM daily_reward_limits WHERE user_id = $1 AND date = today`
  - If any count exceeds the hardcoded maximum, reject immediately with HTTP 200 + `{success: false}`
  - This avoids loading reward_config, checking abuse scores, etc. for users who have already hit limits
- **Client-side cache**: `useRewardBatch.ts` will also cache daily counts locally to avoid sending requests that will be rejected

---

## 4. Video Duration Auto-Classification

**Status**: Already implemented and working correctly.

The Edge Function (lines 352-378) already:
- Reads `videos.duration` from the database
- Reclassifies `SHORT_VIDEO_UPLOAD` to `LONG_VIDEO_UPLOAD` if duration > 180 seconds (3 minutes)
- Handles NULL duration by defaulting to SHORT
- Escrow for FIRST_UPLOAD is active (48-hour hold via cron job)

**No changes needed** -- this feature is complete.

---

## Technical Summary of File Changes

| File | Change |
|------|--------|
| `src/hooks/useRewardBatch.ts` | NEW - Batch queue with auto-flush |
| `src/hooks/useAutoReward.ts` | Update - Route VIEW/LIKE/SHARE through batch |
| `supabase/functions/batch-award-camly/index.ts` | NEW - Batch processing endpoint |
| `supabase/functions/award-camly/index.ts` | Update - Early limit rejection + actualWatchTime validation |
| `src/components/Video/EnhancedVideoPlayer.tsx` | Update - Track accumulated watch time |
| `src/components/Video/MobileVideoPlayer.tsx` | Update - Track accumulated watch time |
| `src/components/Video/YouTubeMobilePlayer.tsx` | Update - Track accumulated watch time |
| `supabase/config.toml` | No change (auto-managed) |

---

## Impact

- **Database writes reduced** by ~70-80% for high-frequency actions (VIEW/LIKE/SHARE)
- **Fast-forward abuse blocked** by tracking real watch time instead of playback position
- **Faster rejections** for users who hit daily limits (fewer DB queries before rejection)
- **No breaking changes** to existing reward amounts, escrow, or admin workflows

