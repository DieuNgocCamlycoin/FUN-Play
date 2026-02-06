

# Plan: Font System Upgrade & Right Sidebar Layout Fix

## Overview

This plan addresses three key areas:
1. **Font system upgrade** -- Making text larger and clearer like YouTube 2025, across web and mobile
2. **Right sidebar width & content fix** -- Ensuring all content fits and displays properly
3. **Move Top Sponsor into the same section as Top Ranking** -- Combining them into one unified card

---

## 1. Current Font Analysis

### Current Setup
- **Font family**: Inter (loaded via Google Fonts in `index.html`)
- **Roboto** is also loaded but not used in the config
- **Base font size**: Browser default 16px (no custom `font-size` on `html` or `body`)

### Problem Areas Found

| Location | Current Size | YouTube Reference | Issue |
|----------|-------------|-------------------|-------|
| Video title (VideoCard) | `text-sm` (14px) | ~16px bold | Too small |
| Channel name (VideoCard) | `text-xs` (12px) | ~14px | Too small |
| Views/timestamp (VideoCard) | `text-xs` (12px) | ~13px | Acceptable but tight |
| Sidebar nav labels | `text-sky-700 font-medium` (14px) | ~14px medium | OK |
| Category chips | `text-sm` (14px) | ~14px | OK |
| Honor Board stat labels | `text-sm` (14px) | - | OK |
| Honor Board stat values | `text-lg` (18px) | - | OK |
| Top Ranking names | `text-sm` (14px) | - | Slightly small |
| Top Ranking CAMLY values | `text-xs` (12px) | - | Too small |
| Top Sponsor names | `text-xs` (12px) | - | Too small |
| Top Sponsor values | `text-[10px]` (10px) | - | Way too small |
| Mobile bottom nav labels | `text-[10px]` (10px) | ~10px | OK (YouTube-like) |
| Mobile header height | `h-12` (48px) | ~48px | OK |
| Mobile "Sign In" button | `text-[9px]` | ~12px | Way too small |
| MobileTopRanking pill text | `text-[10px]` | - | Too small for readability |

### YouTube 2025 Font Reference

YouTube uses **Roboto** with these typical sizes:
- Video title in feed: **16px bold** (font-weight 600-700)
- Channel name: **14px medium**
- View count + date: **13-14px regular**, muted color
- Sidebar items: **14px medium**
- Category chips: **14px medium**

---

## 2. Font Changes Plan

### Global Level (`index.css` and `tailwind.config.ts`)

- Add **Roboto** as primary font alongside Inter for YouTube parity
- Set base `font-size: 15px` on body for slightly larger default

### Component-Level Font Size Upgrades

| Component | Element | Before | After |
|-----------|---------|--------|-------|
| **VideoCard** | Title | `text-sm` (14px) | `text-[15px]` or `text-base` (16px) |
| **VideoCard** | Channel name | `text-xs` (12px) | `text-sm` (14px) |
| **VideoCard** | Views/timestamp | `text-xs` (12px) | `text-[13px]` |
| **TopRankingSection** | User name | `text-sm` (14px) | `text-sm font-semibold` |
| **TopRankingSection** | CAMLY value | `text-xs` (12px) | `text-sm` (14px) |
| **TopRankingSection** | "CAMLY" label | `text-[10px]` | `text-xs` (12px) |
| **TopSponsorSection** | User name | `text-xs` (12px) | `text-sm` (14px) |
| **TopSponsorSection** | Donation value | `text-[10px]` | `text-xs font-bold` |
| **MobileHeader** | Sign In button | `text-[9px]` | `text-xs` (12px) |
| **MobileTopRankingCard** | Rank pill value | `text-[10px]` | `text-xs` (12px) |
| **MobileTopRankingCard** | Avatar fallback | `text-[8px]` | `text-[10px]` |
| **MobileHonoboardCard** | Realtime text | `text-[10px]` | `text-xs` |
| **CategoryChips** | Chip text | `text-sm` (14px) | Keep (matches YouTube) |

---

## 3. Right Sidebar Width & Content Fix

### Current Issue
- Sidebar width: `w-72` (288px) -- content is cramped
- Main content area uses `xl:pr-72` padding to make room

### Solution
- Increase sidebar to `w-80` (320px) -- matches YouTube's right sidebar width
- Update `xl:pr-80` on main content
- Increase internal padding from `px-3` to `px-4`
- Adjust StatPill padding for better readability

### Files Changed
- `HonoboardRightSidebar.tsx`: `w-72` to `w-80`, `px-3` to `px-4`
- `Index.tsx`: `xl:pr-72` to `xl:pr-80`

---

## 4. Merge Top Sponsor INTO Top Ranking Section

### Current Layout (Separate Cards)
```text
[Top 5 Ranking Card]     <-- separate card
[Top Sponsors Card]       <-- separate card with Donate button
```

### New Layout (Combined Card)
```text
┌──────────────────────────────────────┐
│ 🏅 TOP 5 RANKING       CAMLY Rewards │
│ ┌────────────────────────────────────┐│
│ │ 🥇 User A              1.25M CAMLY ││
│ │ 🥈 User B              980K CAMLY  ││
│ │ 🥉 User C              750K CAMLY  ││
│ │ #4 User D              500K CAMLY  ││
│ │ #5 User E              350K CAMLY  ││
│ └────────────────────────────────────┘│
│ [View All Ranking ->]                 │
├──────────────────────────────────────┤
│ 💎 TOP SPONSORS          Donations   │
│ ┌────────────────────────────────────┐│
│ │ 🥇 Sponsor A            500 CAMLY  ││
│ │ 🥈 Sponsor B            350 CAMLY  ││
│ │ 🥉 Sponsor C            200 CAMLY  ││
│ └────────────────────────────────────┘│
│ [ 💖 Donate to Project ]             │
└──────────────────────────────────────┘
```

### Implementation
- Modify `TopRankingSection.tsx` to accept and render sponsors data internally
- Remove standalone `TopSponsorSection` import from `HonoboardRightSidebar.tsx`
- Combine both sections into a single bordered card in `TopRankingSection.tsx`
- The "View All Ranking" button separates the two sections
- The Donate button stays at the bottom of the combined card

---

## 5. Mobile Interface Updates

### MobileTopRankingCard
- Increase font sizes for better readability
- MiniRankPill: Avatar `h-5 w-5` (from `h-4 w-4`), value text `text-xs` (from `text-[10px]`)

### MobileHonoboardCard
- Increase MiniPill value text to `text-xs`
- Better touch target sizes

### HonobarDetailModal
- Increase ranking/sponsor name text to `text-sm font-semibold`
- Increase value text to `text-sm` from `text-xs`

---

## 6. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `tailwind.config.ts` | Edit | Add Roboto to font family |
| `index.html` | Already has Roboto | No change needed |
| `src/index.css` | Edit | Add base font-size rule |
| `src/components/Video/VideoCard.tsx` | Edit | Increase title, channel, metadata font sizes |
| `src/components/Layout/HonoboardRightSidebar.tsx` | Edit | Width `w-80`, remove TopSponsorSection import, increase padding |
| `src/components/Layout/TopRankingSection.tsx` | Edit | Combine with sponsors, increase font sizes |
| `src/components/Layout/TopSponsorSection.tsx` | Edit | Keep as standalone for mobile modal, increase font sizes |
| `src/components/Layout/MobileTopRankingCard.tsx` | Edit | Increase font sizes for readability |
| `src/components/Layout/MobileHonoboardCard.tsx` | Edit | Increase font sizes |
| `src/components/Layout/MobileHeader.tsx` | Edit | Fix Sign In button size |
| `src/components/Layout/HonobarDetailModal.tsx` | Edit | Increase ranking/sponsor text sizes |
| `src/pages/Index.tsx` | Edit | Update `xl:pr-80` |

---

## 7. Implementation Order

1. **Font system** -- `tailwind.config.ts`, `index.css`
2. **VideoCard** -- Title and metadata font sizes
3. **Right sidebar width** -- `HonoboardRightSidebar.tsx` + `Index.tsx`
4. **Merge Ranking + Sponsors** -- `TopRankingSection.tsx` combined card
5. **Sidebar font updates** -- All text size increases
6. **Mobile updates** -- MobileTopRankingCard, MobileHonoboardCard, MobileHeader, HonobarDetailModal

