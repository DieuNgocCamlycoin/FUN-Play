
# Plan: Fix Sidebar Overflow & Display Issues

## Issues Found (from Desktop Screenshot)

The right sidebar content is **overflowing/clipping** on the right edge. Here's what I found:

| Element | Current Display | Problem |
|---------|----------------|---------|
| USERS stat pill value | "1..." (clipped) | Value cut off at edge |
| COMMENTS stat pill value | "3.2..." (clipped) | Number "3.200" too wide |
| VIEWS stat pill value | "4.4..." (clipped) | Number "4.500" too wide |
| VIDEOS stat pill value | "3..." (clipped) | Value cut off |
| CAMLY POOL value | "5.99..." (clipped) | Value partially visible |
| "CAMLY Rewards" header | "CAMLY Rewar..." | Text truncated |
| "Donations" header | "Donatio..." | Text truncated |
| Ranking "CAMLY" labels | "CAML..." | Label cut off next to values |

## Root Causes

### 1. CounterAnimation compact threshold too high
The `compact` mode only kicks in at `>= 10,000`. Numbers between 1,000-9,999 fall through to `toLocaleString('vi-VN')` which formats as "3.200" (with period separator), making values wider than necessary.

### 2. ScrollArea horizontal overflow
The `ScrollArea` component does not restrict horizontal overflow. Content within the `w-80` (320px) sidebar with `px-4` (16px each side) leaves only 288px for content, which is not enough for the stat pills and ranking items.

### 3. Ranking items too wide
Each ranking row shows: badge + avatar + name + value + "CAMLY" text label. The "CAMLY" suffix makes each row too wide for the sidebar.

---

## Fix Plan

### Fix 1: Lower CounterAnimation compact threshold (1000 instead of 10000)

**File: `src/components/Layout/CounterAnimation.tsx`**

Change the compact threshold from `>= 10000` to `>= 1000`:
- 166 users stays as "166"
- 3,200 comments becomes "3.2K" instead of "3.200"  
- 4,500 views becomes "4.5K" instead of "4.500"
- 359 videos stays as "359"
- 5,991,000 CAMLY stays as "5.99M"

### Fix 2: Add horizontal overflow protection to ScrollArea

**File: `src/components/Layout/HonoboardRightSidebar.tsx`**

- Add `overflow-x-hidden` to the ScrollArea wrapper
- Ensure all content respects the sidebar bounds

### Fix 3: Fix TopRankingSection text overflow

**File: `src/components/Layout/TopRankingSection.tsx`**

- Remove the "CAMLY" suffix text from ranking items (the values already use formatted K/M notation)
- Shorten "CAMLY Rewards" header to just "CAMLY" 
- Shorten "Donations" to "Tips"
- Add `truncate` to sponsor/user names to prevent overflow

### Fix 4: Fix HonobarDetailModal stat labels

**File: `src/components/Layout/HonobarDetailModal.tsx`**

- Shorten "TOTAL USERS/COMMENTS/VIEWS/VIDEOS" to "USERS/COMMENTS/VIEWS/VIDEOS" to match the sidebar
- Add compact mode to CounterAnimation in the modal

### Fix 5: Verify Mobile TopRankingCard is complete

**File: `src/components/Layout/MobileTopRankingCard.tsx`**

- Already has sponsors section merged -- verify it works
- No changes needed if display is correct

---

## Files to Change

| File | Changes |
|------|---------|
| `src/components/Layout/CounterAnimation.tsx` | Lower compact threshold from 10000 to 1000 |
| `src/components/Layout/HonoboardRightSidebar.tsx` | Add `overflow-x-hidden` to ScrollArea |
| `src/components/Layout/TopRankingSection.tsx` | Remove "CAMLY" suffix, shorten headers, add truncation |
| `src/components/Layout/HonobarDetailModal.tsx` | Shorten stat labels, add compact CounterAnimation |

---

## Expected Results

| Before | After |
|--------|-------|
| Values clipped: "3.2...", "4.4..." | Values fit: "3.2K", "4.5K" |
| "CAMLY Rewards" truncated | "CAMLY" fits cleanly |
| "Donations" truncated | "Tips" fits cleanly |
| Ranking shows "4.3M CAML..." | Ranking shows "4.3M" (no suffix) |
| Horizontal overflow visible | All content within sidebar bounds |
