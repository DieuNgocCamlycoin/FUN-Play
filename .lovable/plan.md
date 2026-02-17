
# Critical Fix: Redeploy Anti-Farming Gates + Block Single-IP Farming

## Critical Finding

The 24-hour upload gate code exists in the codebase but **is not active on the deployed edge function**. Today alone:
- **15 accounts** bypassed the gate and earned FIRST_UPLOAD rewards within minutes of creation
- **7.5M CAMLY leaked** in a single day
- Farming pattern: create account -> verify avatar -> upload 1 video -> collect 550K CAMLY (50K signup + 500K first upload)
- New farmers use **unique IPs per account** (cluster_size=1), so the IP cluster check does not catch them

## Root Cause

The `award-camly` edge function was not properly redeployed after the gate code was added. The code is correct in the repository but the running version does not include the upload gates.

## Solution: 2-Part Fix

### Part 1: Force Redeploy `award-camly`
- Deploy the edge function immediately to activate the existing 24-hour gate and IP cluster block
- This alone stops the most obvious exploitation pattern

### Part 2: Block Single-IP Farming (New Defense Layer)
The current gates only catch multi-account IPs (5+ accounts). Single-IP farmers (1 account per device) bypass everything. Add a new server-side check:

**Rapid First-Upload Pattern Detection** in `award-camly`:
- For `FIRST_UPLOAD` rewards specifically, check if the video has at least **1 view from a different user** before granting the 500K bonus
- This prevents the "signup -> upload garbage -> claim 500K" pattern because the video must have real engagement
- If no external views yet, return a message: "Your first upload bonus will be credited after your video receives its first view"
- The existing `check-upload-reward` function can be called later to credit the reward

This is resource-efficient because:
- Only 1 extra query (count views excluding uploader) for FIRST_UPLOAD type only
- No new tables or subscriptions needed
- Uses existing `watch_history` or `videos.view_count` data

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/award-camly/index.ts` | Add view-gate for FIRST_UPLOAD: require >= 1 view from another user before granting 500K bonus |
| Deploy `award-camly` | Force redeploy to activate all existing gates (24h age, IP cluster) |
| Deploy `track-ip` | Ensure latest version with lowered auto-ban threshold is active |
| Deploy `backfill-suspicious-scores` | Ensure latest scoring logic is active |

### Technical Details for `award-camly` Change

Inside the existing upload gates section (after Gate B, before the reward type validation), add Gate C:

```text
// Gate C: FIRST_UPLOAD requires at least 1 view from a different user
if (type === 'FIRST_UPLOAD' && videoId) {
  const { count: externalViews } = await adminSupabaseEarly
    .from('watch_history')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', videoId)
    .neq('user_id', userId);

  if ((externalViews || 0) < 1) {
    // Return soft block - reward will be available later
    return Response with:
      success: false
      reason: "Bonus upload đầu tiên sẽ được cộng sau khi video nhận được lượt xem đầu tiên."
  }
}
```

The existing `check-upload-reward` edge function can handle crediting the reward later when views arrive, or the user can trigger it by calling `award-camly` again after their video gets a view.

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Time to exploit FIRST_UPLOAD | ~5 minutes | Must wait for real viewer engagement |
| Single-IP farming | Undetected, 550K/account | Blocked until video has real views |
| Multi-IP cluster farming | Blocked (24h + IP gate, once deployed) | Same, now actually deployed |
| Daily leak rate | 7.5M CAMLY/day | Near zero for farming accounts |

## Existing Pre-Farming Accounts

62 accounts with `suspicious_score=0` hold 23.1M CAMLY pending. Many are legitimate users, but some are single-IP farmers. After the view-gate is deployed:
- New farming is blocked
- Existing pending rewards still require admin approval to withdraw (the approval system is the final safety net)
- Admin can review and ban obvious farming accounts via the IP Abuse Detection tab
