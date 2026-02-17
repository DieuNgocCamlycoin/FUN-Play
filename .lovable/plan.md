
# Fix Remaining Anti-Farming Bypass: check-upload-reward + Deploy Confirmation

## Current Status

The `award-camly` gates ARE working (0 FIRST_UPLOAD rewards granted after the latest deployment at 10:22 UTC). However, all 19 FIRST_UPLOAD exploits today happened before deployment, costing 9.5M CAMLY. The deployed gates are now active and blocking.

## Remaining Vulnerability

The `check-upload-reward` edge function is a **completely separate reward path** that bypasses ALL anti-farming gates. It:
- Awards SHORT_VIDEO_UPLOAD and LONG_VIDEO_UPLOAD rewards
- Has NO account age check (24h gate)
- Has NO IP cluster check
- Has NO suspicious score penalty
- Can be called independently via `supabase.functions.invoke('check-upload-reward')`
- Is called from `useAutoReward.ts` (line 174)

If a farmer's FIRST_UPLOAD is blocked by Gate C, they can still earn 20K-70K per video through `check-upload-reward` once the video gets 3 views (the only gate it has).

## Plan

### 1. Add anti-farming gates to `check-upload-reward/index.ts`

After the user verification (line 79), before the video lookup, add the same gates as `award-camly`:

```text
// Gate A: Account must be 24 hours old
const profileGate = query profiles for created_at, signup_ip_hash where id = user.id
if (account age < 24 hours) return { success: false, reason: "Account must be 24h old" }

// Gate B: Block if 5+ accounts share same signup IP
if (signup_ip_hash exists) {
  count profiles with same signup_ip_hash
  if (count >= 5) return { success: false, reason: "IP cluster blocked" }
}

// Gate C: Ban check
if (profile.banned) return { success: false, reason: "Account suspended" }
```

### 2. Force redeploy all 3 security edge functions

Deploy `award-camly`, `check-upload-reward`, and `track-ip` to ensure the latest code is live.

### 3. No client-side changes needed

The client already handles `success: false` responses gracefully from both functions. Both web and mobile use the same edge functions, so the fix applies to both platforms automatically.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/check-upload-reward/index.ts` | Add ban check + 24h account age gate + IP cluster gate (lines 79-88) |
| Deploy `check-upload-reward` | Force deploy to activate gates |
| Deploy `award-camly` | Confirm latest version is live |
| Deploy `track-ip` | Confirm latest version is live |

## Technical Details

In `check-upload-reward/index.ts`, after line 79 (user verification), add:

```typescript
// === ANTI-FARMING GATES ===
const { data: profileGate } = await adminSupabase
  .from('profiles')
  .select('created_at, signup_ip_hash, banned')
  .eq('id', user.id)
  .single();

// Ban check
if (profileGate?.banned) {
  return Response({ success: false, error: 'Account suspended' });
}

// Gate A: 24-hour account age
const ageHours = (Date.now() - new Date(profileGate.created_at).getTime()) / 3600000;
if (ageHours < 24) {
  return Response({ success: false, reason: 'Account must be 24h old for upload rewards' });
}

// Gate B: IP cluster block (5+ accounts)
if (profileGate.signup_ip_hash) {
  const sameIpCount = count profiles with same signup_ip_hash;
  if (sameIpCount >= 5) {
    return Response({ success: false, reason: 'Upload rewards blocked - suspicious IP' });
  }
}
```

## Impact

- Closes the last unprotected reward path for upload rewards
- Zero new database tables or subscriptions
- 1 extra query per `check-upload-reward` call (profile check, using indexed column)
- Works on both web and mobile (shared backend)
- The 19 accounts that exploited before deployment still have their pending rewards, but these require admin approval to withdraw -- the admin can ban them via the IP Abuse Detection tab
