

# Plan: Enable Collapsible Sidebar (Zoom) on All Pages

## What's Happening Now

The **homepage** (`Index.tsx`) already has the collapsible sidebar feature working -- clicking the hamburger menu toggles the sidebar between **full mode** (labels + icons, 240px) and **mini mode** (icons only, 64px). This makes the content area expand or shrink smoothly.

However, **all other pages** (Leaderboard, Channel, FUN Wallet, Studio, Watch History, Playlists, Music, Posts, etc.) use `MainLayout.tsx` which still uses the **old fixed Sidebar** -- the hamburger button does nothing useful on desktop. The sidebar is always 256px wide and never collapses.

## The Fix

Replace the old `Sidebar` with the `CollapsibleSidebar` in `MainLayout.tsx`, so the hamburger menu toggles between expanded and mini mode on every page.

## Changes

### File: `src/components/Layout/MainLayout.tsx`

Current behavior:
- Uses `Sidebar` (always 256px on desktop)
- Hamburger button toggles a mobile overlay, does nothing on desktop
- Main content always has `lg:pl-64` (fixed padding)

New behavior:
- Replace `Sidebar` with `CollapsibleSidebar`
- Add `isSidebarExpanded` state (default: `true`)
- Desktop hamburger click toggles `isSidebarExpanded`
- Mobile hamburger click opens `MobileDrawer` (unchanged)
- Main content padding changes dynamically: `lg:pl-60` (expanded) or `lg:pl-16` (collapsed)
- Smooth CSS transition on the padding change

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Desktop sidebar | Always full width (256px) | Toggles between 240px and 64px |
| Hamburger on desktop | No visible effect | Collapses/expands sidebar smoothly |
| Content area | Fixed padding | Expands when sidebar collapses |
| Mobile behavior | No change | No change (MobileDrawer still works) |

### Pages That Will Benefit

All pages using `MainLayout`:
- Leaderboard, Channel, FUN Wallet, Watch History, Liked Videos, Watch Later
- Browse Music, Music Detail, Post Detail, Create Post, Edit Post
- Subscriptions, Upload, Downloaded Videos, Your Videos
- Manage Channel, Manage Playlists, Manage Posts
- Profile, Settings, Referral, Reward History
- Wallet, NFT Gallery, CAMLY Price, Install PWA

### Code Summary

```text
MainLayout.tsx
  - Import CollapsibleSidebar instead of Sidebar
  - Add isSidebarExpanded state
  - Desktop: hamburger toggles isSidebarExpanded
  - Mobile: hamburger opens MobileDrawer (no change)
  - Dynamic padding: lg:pl-60 or lg:pl-16
  - Add transition-all duration-300 for smooth animation
```

Only **one file** needs to change: `src/components/Layout/MainLayout.tsx`

