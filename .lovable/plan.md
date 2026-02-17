
# Fake Account Analysis and Anti-Abuse Optimization

## Current Situation

### Abuse Evidence
| IP Hash (first 12 chars) | Accounts | Pending CAMLY | No Avatar | No Wallet |
|---|---|---|---|---|
| 5f84aa2687c5 | 116 | 60,652,000 | 43 | 45 |
| 25029938dc41 | 50 | 26,500,000 | 0 | 10 |
| 73a082f252f5 | 31 | 12,373,000 | 1 | 5 |
| c81dc3922bbe | 27 | 4,468,000 | 26 | 17 |
| 9e9696491ebc | 20 | 14,500,000 | 0 | 2 |
| 307f6a19c3d2 | 19 | 10,061,000 | 0 | 0 |
| ...more | ~80+ | ~59M+ | many | many |

- **681 accounts** with auto-generated `user_XXXXXXXX` usernames hold **187.5M pending CAMLY**
- **0 out of 684 users** have a suspicious_score set (all are 0)
- **0 accounts banned** from these farming IPs

### Root Cause: `detect-abuse` is Dead Code
The `detect-abuse` edge function exists and works correctly, but **nothing ever calls it**:
- No frontend code invokes it
- No other edge function calls it
- The `award-camly` function checks `suspicious_score` but it's always 0 because nobody populates it
- `AUTO_APPROVE_ENABLED` is set to 0 (OFF), so all rewards go to pending anyway -- but the abuse scoring system should still work for admin visibility

## Plan

### 1. Integrate `detect-abuse` into the reward flow (award-camly edge function)

Call the abuse detection logic **inline** within `award-camly` instead of as a separate HTTP call (saves network overhead). Add a lightweight suspicious score check directly in the `award-camly` function that updates the user's `suspicious_score` on each reward grant.

This means: every time a user earns a reward, their abuse score gets recalculated. No separate function call needed.

### 2. Delete the standalone `detect-abuse` edge function

Since the logic will be integrated directly into `award-camly`, the standalone function becomes unnecessary dead code. Remove:
- `supabase/functions/detect-abuse/index.ts`
- Its config entry in `supabase/config.toml` (auto-managed)

### 3. Add IP-based signup rate limiting in `track-ip`

Enhance the existing `track-ip` edge function to check for rapid signups from the same IP and automatically set a high `suspicious_score` on the profile during signup. This catches farming bots at registration time.

### 4. Clean up unused code in frontend

Remove the unused `userId` parameter from `awardCAMLY()` in `enhancedRewards.ts` -- the edge function gets the user from the auth token, so this parameter is never sent.

## Technical Details

### File: `supabase/functions/award-camly/index.ts`

Add an inline abuse score calculation after the user is authenticated (around the trust score gating section, lines 481-513). Instead of checking a stale `suspicious_score`, compute it fresh:

```typescript
// Inline abuse detection (replaces external detect-abuse call)
let suspiciousScore = 0;

// Check signup IP for multi-account farming
const { data: profileForAbuse } = await adminSupabase
  .from("profiles")
  .select("signup_ip_hash, avatar_url, avatar_verified, display_name, created_at")
  .eq("id", userId)
  .single();

if (profileForAbuse?.signup_ip_hash) {
  const { count: sameIpCount } = await adminSupabase
    .from("ip_tracking")
    .select("user_id", { count: "exact", head: true })
    .eq("ip_hash", profileForAbuse.signup_ip_hash)
    .eq("action_type", "signup");
  
  if ((sameIpCount || 0) > 5) suspiciousScore += 3;
  else if ((sameIpCount || 0) > 2) suspiciousScore += 1;
}

if (!profileForAbuse?.avatar_url) suspiciousScore += 1;
if (!profileForAbuse?.avatar_verified) suspiciousScore += 1;
if (!profileForAbuse?.display_name || profileForAbuse.display_name.length < 3) suspiciousScore += 1;

// Update suspicious_score in profile
await adminSupabase
  .from("profiles")
  .update({ suspicious_score: suspiciousScore })
  .eq("id", userId);
```

This replaces the current block at lines 501-508 that reads the stale score.

### File: `supabase/functions/track-ip/index.ts`

Add a signup rate-limit check: if the same IP hash has 3+ signups in the last hour, set the new user's `suspicious_score` to 5 (above the auto-approve threshold of 3):

```typescript
// After inserting into ip_tracking for signup actions
if (action_type === 'signup') {
  // Check for rapid signups from same IP
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await supabaseAdmin
    .from('ip_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('action_type', 'signup')
    .gte('created_at', oneHourAgo);

  if ((recentSignups || 0) >= 3) {
    await supabaseAdmin
      .from('profiles')
      .update({ suspicious_score: 5 })
      .eq('id', user.id);
    console.log(`[track-ip] Flagged user ${user.id} with suspicious_score=5 (${recentSignups} signups from same IP in 1hr)`);
  }
  
  // existing signup_ip_hash update...
}
```

### File: `supabase/functions/detect-abuse/index.ts`

**DELETE** this entire file. Its logic is now integrated into `award-camly` and `track-ip`.

### File: `src/lib/enhancedRewards.ts`

Remove unused `userId` parameter from `awardCAMLY()`:

```typescript
// Change from (line 121-125):
export const awardCAMLY = async (
  userId: string,
  amount: number,
  type: "VIEW" | "LIKE" | ...,
  videoId?: string
)

// To:
export const awardCAMLY = async (
  amount: number,
  type: "VIEW" | "LIKE" | ...,
  videoId?: string
)
```

Then update all callers to remove the `userId` argument.

### Callers to update

Search and update all files that call `awardCAMLY(userId, ...)` to `awardCAMLY(...)` (removing the first argument).

### No database changes needed
### No new dependencies needed
