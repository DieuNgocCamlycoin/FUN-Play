

# Add Unban Button to IP Abuse Detection Tab

## Problem
The IP Abuse Detection tab only has "Ban" functionality. When you accidentally ban a real person from this view, there is no way to unban them without navigating to a completely different section (User Management > Banned Users tab). This is inconvenient and error-prone.

## Solution
Add an individual "Unban" button next to each banned user in the IP cluster view, with a confirmation dialog. This requires passing the `onUnban` function through the component chain.

## Changes

### 1. `src/components/Admin/tabs/IPAbuseDetectionTab.tsx`
- Add `onUnban` to the props interface
- Import `UserCheck` icon
- For each banned user row, add an "Unban" button with an AlertDialog confirmation
- After successful unban, refresh IP groups data

### 2. `src/components/Admin/tabs/WalletAbuseTab.tsx`
- Add `onUnban` to the props interface
- Pass `onUnban` through to `IPAbuseDetectionTab`

### 3. Parent component that renders `WalletAbuseTab`
- Pass the existing `unbanUser` function from `useAdminManage` as the `onUnban` prop

## Technical Details

The `unban_user` RPC already exists and works correctly -- it clears the banned flag, removes reward bans, and deletes the wallet from the blacklist. The `useAdminManage` hook already exposes `unbanUser`. The only missing piece is wiring the unban action into the IP Abuse Detection UI.

**User row changes**: Each banned user in an IP cluster will show a small "Unban" button (using `UserCheck` icon) instead of just the "Da ban" badge. Clicking it opens a confirmation dialog showing the user's name before proceeding.

**No database changes needed** -- all RPCs are already in place.

