

# Final Anti-Abuse Cleanup: Remove Dead Code

## Current Status

The anti-abuse system changes from the previous plan are working correctly:
- **`award-camly`**: Now computes `suspicious_score` inline on every reward grant (IP farming check, avatar check, display name check)
- **`track-ip`**: Flags new signups from IPs with 3+ signups in the last hour with `suspicious_score = 5`
- **`detect-abuse`**: Successfully deleted (was dead code)

## Remaining Issue Found

### `src/lib/enhancedRewards.ts` is entirely dead code

This 225-line file is **not imported by any other file** in the project. The actual reward system uses `src/hooks/useAutoReward.ts`, which has its own `awardCAMLY` function that calls the edge function directly.

The previous plan cleaned up the `userId` parameter from this file, but the entire file should simply be deleted since nothing uses it.

## Plan

### Delete `src/lib/enhancedRewards.ts`

Remove this file entirely. It contains:
- Duplicate `awardCAMLY()` function (unused -- `useAutoReward.ts` is the real one)
- Reward constants that are duplicated from the edge function
- Helper functions (`isClaimable`, milestone logic) that are never called

This saves ~225 lines of dead code and eliminates confusion about which `awardCAMLY` is the "real" one.

### No other changes needed

- Edge functions (`award-camly`, `track-ip`) are already optimized from the previous plan
- No database changes needed
- No new dependencies needed

