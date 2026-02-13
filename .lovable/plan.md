
# Add Fun Play Logo to Key Pages

## Overview
Save the uploaded Fun Play logo to `src/assets/funplay-planet-logo.png` and place it in the header area of 6 pages/components, replacing the current icon circles with the logo image.

## Pages to Update

### 1. Reward History (`src/pages/RewardHistory.tsx`)
- Replace the `<Coins>` icon (line 310) with the Fun Play logo (h-10 w-10 rounded-full)
- Logo sits next to the "Lich Su Thuong CAMLY" title

### 2. Transactions (`src/pages/Transactions.tsx`)
- Replace the `<Globe>` icon inside the animated circle (lines 44-57) with the Fun Play logo image
- Keep the glowing animation, swap icon for logo

### 3. Watch History (`src/pages/WatchHistory.tsx`)
- Replace the gradient circle with `<History>` icon (lines 102-104) with the Fun Play logo
- Keep the same size (w-12 h-12 rounded-full)

### 4. Users Directory (`src/pages/UsersDirectory.tsx`)
- Replace the `<Users>` icon in header (lines 135-137) with the Fun Play logo
- Same container style (p-2.5 rounded-xl)

### 5. Admin Dashboard Layout (`src/components/Admin/UnifiedAdminLayout.tsx`)
- Replace the gradient div with `<Crown>` icon (lines 84-86) with the Fun Play logo
- Keep the same size (w-10 h-10 rounded-xl)

### 6. Receipt Page (`src/pages/Receipt.tsx`)
- Replace the Gift icon circle (lines 94-97) with the Fun Play logo
- Keep centered layout, same size (h-12 w-12)

## Technical Details

- Copy `user-uploads://7.png` to `src/assets/funplay-planet-logo.png`
- Import in each file: `import funplayPlanetLogo from "@/assets/funplay-planet-logo.png"`
- Use `<img src={funplayPlanetLogo} alt="FUN Play" className="h-10 w-10 rounded-full object-cover" />` (sizes adjusted per page)
- Mobile-optimized sizing maintained in all pages
