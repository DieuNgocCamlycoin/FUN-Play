
# Smart Anti-Farming Upgrade: Block Fake Account Video Upload Exploitation

## Problem Found

Live database analysis reveals a clear farming pattern:
- **10 accounts from 1 IP address** created within 76 minutes (Feb 15, 4:38 AM - 5:54 AM)
- Each account has exactly **550,000 CAMLY pending** (50K signup + 500K first upload bonus)
- Only 1 out of 10 was banned -- the current auto-ban threshold (3 banned from same IP) was never triggered
- The farming strategy: create account, verify avatar, upload 1 low-quality video, collect 550K CAMLY, repeat
- Total exploited: **4,497,000 CAMLY** from just this one IP cluster alone

## Root Causes

1. **No account age gate for uploads**: Brand new accounts can immediately upload and earn 500K first-upload bonus
2. **No IP-based upload throttling**: The `award-camly` function checks IP for suspicious_score but still awards rewards to score=3 accounts (threshold is also 3, so `<` check means score=3 passes)
3. **Auto-ban threshold too high**: Requires 3 banned accounts from same IP before auto-banning new ones, but farmers create 10+ accounts before any get banned
4. **First upload bonus is too exploitable**: 500K CAMLY for a single upload is the primary target

## Solution: 3-Layer Defense

### Layer 1: Server-side Upload Gate in `award-camly` (Edge Function)
Add new checks specifically for upload rewards (SHORT/LONG_VIDEO_UPLOAD and FIRST_UPLOAD):

- **Account age requirement**: Account must be at least 24 hours old to earn upload rewards (views/likes/comments still work immediately)
- **IP cluster block**: If 5+ accounts share the same signup IP hash, block upload rewards for ALL of them (not just new ones)
- **Fix suspicious_score threshold**: Change `suspiciousScore < autoApproveThreshold` to `suspiciousScore <= autoApproveThreshold - 1` so score=3 accounts require admin approval when threshold=3

### Layer 2: Upload Gate Enhancement in `useUploadGate.ts` (Client-side)
Add a `suspicious_score` check to the pre-upload gate:
- If `suspicious_score >= 3`, show a warning that the upload will require admin review
- This gives honest users transparency while deterring farmers (they see their content won't auto-approve)

### Layer 3: Smarter Auto-Ban in `track-ip` (Edge Function)
Lower the auto-ban threshold and add graduated response:
- **3+ unbanned accounts from same IP with pending rewards > 500K each**: Auto-flag all as suspicious_score=5
- **2+ banned accounts from same IP** (lowered from 3): Auto-ban new signups

## Files to Change

### 1. `supabase/functions/award-camly/index.ts`
After the ban check (line 221), add upload-specific gates:

```
// NEW: Upload reward gates (after ban check, before reward logic)
if (['SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD', 'UPLOAD', 'FIRST_UPLOAD'].includes(type)) {
  // Gate A: Account age check (24 hours)
  const profileAge = await adminSupabase.from('profiles')
    .select('created_at, signup_ip_hash')
    .eq('id', userId).single();
  
  const ageHours = (Date.now() - new Date(profileAge.data.created_at).getTime()) / 3600000;
  if (ageHours < 24) {
    return Response: "Account must be 24 hours old for upload rewards"
  }
  
  // Gate B: IP cluster check (5+ accounts from same IP)
  if (profileAge.data.signup_ip_hash) {
    const sameIpCount = count profiles with same signup_ip_hash
    if (sameIpCount >= 5) {
      return Response: "Upload rewards blocked due to suspicious IP activity"
    }
  }
}
```

### 2. `supabase/functions/award-camly/index.ts` - Fix threshold comparison
Line 547: Change `suspiciousScore < autoApproveThreshold` to `suspiciousScore < autoApproveThreshold` remains but ensure threshold default is correctly applied. The real fix is in Gate B above which catches the cluster pattern.

### 3. `supabase/functions/track-ip/index.ts`
Lower auto-ban threshold from 3 to 2 banned accounts:
```
// Line ~117: Change bannedFromSameIp >= 3 to >= 2
if ((bannedFromSameIp || 0) >= 2) {
  // auto-ban
}
```

Add IP cluster flagging for unbanned accounts with high rewards:
```
// After signup tracking, check if IP has 5+ accounts with high pending
// If so, flag all as suspicious_score = 5
```

### 4. `src/hooks/useUploadGate.ts`
Add suspicious_score to the profile query and show warning:
```
// Step 1: Expand query
.select("avatar_verified, suspicious_score")

// After avatar check, add:
if (profile.suspicious_score >= 3) {
  return { allowed: true, approvalStatus: "pending_review" }
}
```

### 5. `supabase/functions/backfill-suspicious-scores/index.ts`
Add IP cluster size as a stronger signal:
- If an IP has 5+ accounts: score += 5 (instead of current 3)
- This ensures existing farming clusters get flagged on next backfill

## Resource Efficiency

- **No new database tables** -- uses existing `profiles.signup_ip_hash` and `ip_tracking`
- **No new real-time subscriptions** -- the existing 3 channels already cover all changes
- **Server-side only for critical gates** -- the account age and IP cluster checks happen in the Edge Function, not the client
- **Client-side gate is a soft warning only** -- just adds `suspicious_score` to an existing query (no extra DB call)
- All checks use indexed columns (`signup_ip_hash`, `user_id`, `banned`)

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Time to create + exploit account | ~5 minutes | 24+ hours minimum |
| Accounts before auto-ban triggers | 3 banned needed | 2 banned needed |
| IP cluster detection | Only at reward time | At signup + reward time |
| Upload reward for suspicious accounts | Auto-approved | Requires admin review |
| Farming cluster visibility | Score 3 (borderline) | Score 5+ (clearly flagged) |
