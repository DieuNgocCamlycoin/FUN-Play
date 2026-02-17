
# Fix Minor Threshold Inconsistency in Anti-Farming System

## Current Status: System is Working

The 3-layer anti-farming defense is fully deployed and operational. Evidence:
- Top farming clusters (116, 50, 30, 27 accounts each) are 100% banned with 0 pending rewards
- New fake accounts are auto-banned at signup if 2+ banned accounts share the same IP
- Upload rewards are blocked for accounts under 24 hours old
- Upload rewards are blocked for IP clusters with 5+ accounts

## Remaining Issue

One minor threshold inconsistency in `award-camly`:
- **Gate B** (upload block, line 252): blocks if `sameIpAccounts >= 5` (correct)
- **Inline abuse scoring** (line 571): adds +3 to suspicious score only if `sameIpCount > 5` (should be `>= 5` to match)

This means accounts in a cluster of exactly 5 get blocked from upload rewards (Gate B) but their suspicious_score only gets +1 instead of +3, so non-upload rewards (views, likes) might auto-approve when they shouldn't.

## Change

### File: `supabase/functions/award-camly/index.ts` (line 571)

Change the inline abuse scoring threshold to match Gate B:

```
// Before:
if ((sameIpCount || 0) > 5) suspiciousScore += 3;

// After:
if ((sameIpCount || 0) >= 5) suspiciousScore += 3;
```

This ensures consistent behavior: clusters of 5+ accounts get the full +3 suspicious score penalty for ALL reward types, not just uploads.

## Pre-existing Farming Accounts

16 unbanned accounts from 2 IP clusters still hold 5.4M CAMLY in pending rewards. These were created before the defense was deployed. Their rewards require admin approval (suspicious_score=3, cannot auto-approve), so they cannot withdraw. The admin can ban them manually via the IP Abuse Detection tab -- no code change needed for this.

## Impact
- Single line change in one edge function
- No new tables, no new subscriptions
- Consistent threshold across all reward types
- Works on both web and mobile (shared backend)
