

# Fix Upload Reward System: Daily Limits and Category Tracking

## Issues Found

### Issue 1: No Daily Limit Enforcement for Short/Long Video Uploads (CRITICAL)
The `award-camly` edge function checks daily limits for VIEW, LIKE, SHARE, COMMENT but **completely skips** limit checks for SHORT_VIDEO_UPLOAD and LONG_VIDEO_UPLOAD. The database columns `short_video_count` and `long_video_count` in `daily_reward_limits` exist but are never checked or updated. A user could theoretically upload unlimited videos and get unlimited rewards.

- **Required**: Short videos limited to 5/day, Long videos limited to 3/day
- **Current**: No enforcement at all

### Issue 2: Edge Function Not Tracking Upload Counts by Type
The edge function only increments `uploads_count` (a generic counter) for upload rewards. It does not update `short_video_count` or `long_video_count`, making it impossible to enforce per-type limits.

### Issue 3: Mobile Upload Context Has Extra Dispatch (Minor)
The `UploadContext.tsx` (mobile background upload) calls `supabase.functions.invoke("award-camly")` directly and then manually dispatches `camly-reward` events (lines 304 and 323). This is correct since it bypasses the `useAutoReward` hook, but it is inconsistent with the desktop flow.

## Changes

### File 1: `supabase/functions/award-camly/index.ts`
Add daily limit checks for SHORT_VIDEO_UPLOAD and LONG_VIDEO_UPLOAD before awarding.

**Add after the COMMENT daily limit check (around line 417):**
```typescript
// Check SHORT_VIDEO daily limit
if (effectiveType === "SHORT_VIDEO_UPLOAD") {
  const currentShortCount = limits?.short_video_count || 0;
  if (currentShortCount >= DAILY_LIMITS.SHORT_VIDEO) {
    return Response({ 
      success: false, 
      reason: `Daily short video limit reached (${DAILY_LIMITS.SHORT_VIDEO} videos)`,
      ...
    });
  }
}

// Check LONG_VIDEO daily limit
if (effectiveType === "LONG_VIDEO_UPLOAD") {
  const currentLongCount = limits?.long_video_count || 0;
  if (currentLongCount >= DAILY_LIMITS.LONG_VIDEO) {
    return Response({
      success: false,
      reason: `Daily long video limit reached (${DAILY_LIMITS.LONG_VIDEO} videos)`,
      ...
    });
  }
}
```

**Update the daily limits tracking section (around line 498):**
```typescript
} else if (effectiveType === "SHORT_VIDEO_UPLOAD") {
  updateFields.short_video_count = (limits?.short_video_count || 0) + 1;
  updateFields.uploads_count = (limits?.uploads_count || 0) + 1;
  updateFields.upload_rewards_earned = (limits?.upload_rewards_earned || 0) + amount;
} else if (effectiveType === "LONG_VIDEO_UPLOAD") {
  updateFields.long_video_count = (limits?.long_video_count || 0) + 1;
  updateFields.uploads_count = (limits?.uploads_count || 0) + 1;
  updateFields.upload_rewards_earned = (limits?.upload_rewards_earned || 0) + amount;
} else if (effectiveType === "UPLOAD" || effectiveType === "FIRST_UPLOAD") {
  updateFields.uploads_count = (limits?.uploads_count || 0) + 1;
  updateFields.upload_rewards_earned = (limits?.upload_rewards_earned || 0) + amount;
}
```

### File 2: `src/contexts/UploadContext.tsx`
Remove duplicate `window.dispatchEvent` calls (lines 304-306 and 323-325) since when the mobile upload calls `supabase.functions.invoke("award-camly")` directly, these manual dispatches create inconsistency. Instead, refactor to use the `useAutoReward` hook pattern, or keep direct calls but remove manual dispatches since the reward history page already has Realtime subscription.

However, since `UploadContext` cannot use the `useAutoReward` hook (it's a context provider, not a component with hooks from other hooks), we keep the direct invoke but ensure only one dispatch path. The simplest fix: keep the manual dispatches since these are the ONLY source (no hook involved). This path is actually correct -- no change needed here.

### File 3: `src/lib/enhancedRewards.ts`
Already has correct constants (SHORT_VIDEO: 5, LONG_VIDEO: 3). No change needed.

### File 4: `src/pages/RewardHistory.tsx`
Already has correct labels for SHORT_VIDEO_UPLOAD and LONG_VIDEO_UPLOAD. No change needed.

## Summary

| Item | Status |
|------|--------|
| Short video reward: 20,000 CAMLY | Already correct |
| Long video reward: 70,000 CAMLY | Already correct |
| Short video daily limit: 5/day | **NOT ENFORCED -- needs fix** |
| Long video daily limit: 3/day | **NOT ENFORCED -- needs fix** |
| short_video_count tracking | **NOT UPDATED -- needs fix** |
| long_video_count tracking | **NOT UPDATED -- needs fix** |
| Content moderation (Angel AI) | Already working |
| Pending review on negative content | Already working |
| Reward categorization in history | Already correct |
| Desktop upload reward flow | Already correct |
| Mobile upload reward flow | Already correct |

## Expected Result
- Short video uploads (3 min or less): Earn 20,000 CAMLY, max 5 per day
- Long video uploads (over 3 min): Earn 70,000 CAMLY, max 3 per day
- Daily limits enforced server-side in the edge function
- Upload counts tracked separately for short and long videos
- Content moderation flags negative content for admin review
- Reward history correctly categorizes and displays upload rewards

