

# Fix: Reward History Not Showing Pending + Long Videos Miscounted

## Problems Found

### Problem 1: "Cho duyet" (Pending) Always Shows 0
On line 189 of `src/pages/RewardHistory.tsx`, the code hardcodes `setTotalPending(0)` instead of using the `pending_camly` value returned by the RPC function. Since we turned off auto-approve, all new rewards go to pending -- but the page never shows them.

### Problem 2: 153 Videos Got Wrong Reward (20,000 instead of 70,000)
The database has 153 reward transactions marked as `SHORT_VIDEO_UPLOAD` (20,000 CAMLY) where the video has `duration = NULL`. Many of these are likely long videos (>3 minutes) that should receive 70,000 CAMLY. When duration metadata wasn't available at upload time, the system defaulted to SHORT.

The `recalculate-upload-rewards` edge function already exists and can fix this, but only after the videos get their duration metadata backfilled (which happens when someone watches them on the Watch page).

### Problem 3: Status Filter Missing "Pending" Option
The filter dropdown on line 431-435 removed the "Cho duyet" (Pending) option, so users can't filter to see their pending rewards.

---

## Fixes

### 1. Fix Reward History Page (`src/pages/RewardHistory.tsx`)

**Line 189**: Change `setTotalPending(0)` to `setTotalPending(Number(s.pending_camly) || 0)`

**Lines 431-435**: Add back the "Cho duyet" filter option in the status dropdown

**Add "Cho duyet" stats card**: Currently there are only 3 stats cards (Total Earned, Claimable, Claimed). Add a 4th card for "Cho duyet" (Pending) between Total Earned and Claimable, using an orange/amber color theme with a Clock icon.

**Grid adjustment**: Change stats grid from `grid-cols-2 md:grid-cols-4` with 3 items to 4 items to fill properly.

### 2. Trigger Duration Backfill + Reward Recalculation
Deploy and call the existing `recalculate-upload-rewards` function in dry-run mode first to see how many videos need fixing. Then the admin can run it with `dryRun=false` to apply corrections.

### 3. Mobile Responsiveness
The stats grid will use `grid-cols-2 md:grid-cols-4` so on mobile, the 4 cards display in a clean 2x2 grid.

---

## Technical Changes

| File | Change |
|------|--------|
| `src/pages/RewardHistory.tsx` | Fix pending display, add pending stats card, add pending filter option |

### Detailed Changes in RewardHistory.tsx:

1. **Line 189**: `setTotalPending(Number(s.pending_camly) or 0)` instead of `setTotalPending(0)`

2. **Lines 361-397**: Add 4th stats card for "Cho duyet" (Pending) with Clock icon and orange gradient, between the "Total Earned" and "Claimable" cards

3. **Lines 431-435**: Add `<SelectItem value="pending">Cho duyet</SelectItem>` to the status filter dropdown

No edge function changes needed -- the award-camly logic is correct. The display-only bug in RewardHistory was hiding the pending data from users.
