

# Immediate Fix: Batch Correct Wrong Video Durations

## Problem

The self-healing auto-duration fix (deployed in the last update) only corrects durations when a video is **played**. Hundreds of videos still have incorrect short durations in the database (e.g., stored as 4-8 seconds when they are actually 3-5 minutes long). These videos incorrectly appear in the **Shorts** tab.

Example from the channel you're viewing:
- "8 CAU THAN CHU CUA CHA (1)" -- stored: 34s (likely much longer)
- "VUON XINH" -- stored: 8s (likely much longer)
- "KHU VUON XINH DEP" -- stored: 4-8s (likely much longer)

## Solution

### 1. Database Migration: Reset suspicious durations to NULL

Run a one-time SQL migration to set `duration = NULL` for all videos that have suspiciously short durations (10 seconds or less). These are almost certainly incorrect values.

Videos with `NULL` duration already correctly appear in the **Videos** tab (not Shorts), because the filter is:
- Shorts: `duration IS NOT NULL AND duration <= 180`
- Videos: `duration > 180 OR duration IS NULL`

So resetting to NULL immediately moves them out of Shorts.

### 2. Self-healing continues working

The existing auto-duration code (already deployed) will re-detect the correct duration when these videos are played, and update the database. Videos will then be permanently sorted into the correct tab.

## Database Change

```text
UPDATE videos 
SET duration = NULL 
WHERE duration IS NOT NULL 
  AND duration <= 10;
```

This affects videos with stored durations of 3-10 seconds, which are almost certainly wrong metadata captures.

## Files Changed

No code file changes needed -- the filtering logic and self-healing code are already correct. Only a database migration is required.

| Change | Details |
|--------|---------|
| SQL Migration | Reset `duration` to NULL for all videos with `duration <= 10` |

## Expected Result

- Videos with wrong short durations immediately disappear from Shorts tab
- They appear in Videos tab until watched (when auto-fix sets the real duration)
- Once watched, they permanently sort into the correct tab
- Truly short videos (real 10s or less) will get re-detected correctly when played

