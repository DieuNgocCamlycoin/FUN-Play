
# System Check Report & Fix Plan for FUN Play

## Issues Found

### Issue 1: CRITICAL - Realtime Subscription Flapping
Console logs show the Realtime subscription rapidly cycling between SUBSCRIBED and CLOSED dozens of times per second. This causes:
- Excessive network connections to the backend
- Potential performance degradation
- Connection instability for all realtime features

**Root Cause**: The `useRewardRealtimeNotification` hook in `AppContent` creates channels with the same name `'reward-approval-notification'`. When the `user?.id` dependency changes (e.g., auth state resolves), the cleanup removes the channel and re-creates it, but since it runs on every render cycle during auth resolution, it creates a rapid subscribe/unsubscribe loop.

**Fix**: Add a `useRef` guard to prevent re-subscription while a channel is already active, and use `user?.id` in the channel name to make it unique per session.

### Issue 2: TokenLifecyclePanel Mobile Arrow Layout Broken
The arrow connectors between lifecycle states have a layout problem on mobile. The current code wraps both the state card and arrows inside a `flex items-center` div. On mobile (single-column grid), the horizontal flex causes arrows to sit beside the card instead of between cards vertically.

**Fix**: Restructure so the vertical arrows appear as separate grid items between state cards on mobile, rather than inside a horizontal flex container.

### Issue 3: MobileHeader Overcrowded (8 Buttons in 390px)
The Download App button has a `animate-ping` overlay that creates visual noise and takes up precious space. With 8 action icons in a 390px header, each button is only 28px (h-7 w-7), making tapping difficult.

**Fix**: Remove the Download App button entirely from the mobile header (it's already available in MobileDrawer). This frees up ~32px of horizontal space and removes visual distraction.

### Issue 4: FunMoneyPage "5 Pillars" Grid Cramped on Small Screens
The "5 Tru Cot Anh Sang" section uses `grid-cols-5` which on 320px screens gives each pillar only ~55px width. Text overflows and the layout looks broken.

**Fix**: Use `grid-cols-3 sm:grid-cols-5` so pillars wrap into 2 rows on very small screens with the remaining 2 in a second row.

### Issue 5: MintRequestList Filter Buttons Overflow on Mobile
The history tab has 5 filter buttons that don't fit in a single row on mobile, causing uncontrolled wrapping.

**Fix**: Make the filter row horizontally scrollable with `overflow-x-auto scrollbar-hide` for a clean pill-style chip experience.

### Issue 6: MobileHeader Height Mismatch with MainLayout
The MobileHeader uses `h-12` (48px) but `MainLayout` applies `pt-14` (56px) padding-top, creating an 8px gap between the header and the content.

**Fix**: Align the header height and content padding to both use 48px (`h-12` and `pt-12`).

### Issue 7: WalletConnect CSP Error (Non-Critical)
Console shows `Framing 'https://secure.walletconnect.org/' violates CSP`. This is a known WalletConnect v2 issue in iframed preview environments and does not affect the published app.

**Status**: No action needed.

---

## Implementation Plan

### Phase 1: Fix Realtime Subscription Flapping (Critical)

**File**: `src/hooks/useRewardRealtimeNotification.ts`
- Add a `channelRef` to track the active channel
- Include `user.id` in the channel name for uniqueness
- Add a guard to prevent re-subscription while already connected
- This will stop the rapid SUBSCRIBED/CLOSED cycling visible in console logs

### Phase 2: Fix MobileHeader - Remove Download Button

**File**: `src/components/Layout/MobileHeader.tsx`
- Remove the "Download App" button (lines 226-244) which has a distracting `animate-ping` overlay
- This button is already accessible from the MobileDrawer under the rewards section
- Reclaiming this space improves touch targets for remaining buttons

### Phase 3: Fix MobileHeader/MainLayout Height Mismatch

**File**: `src/components/Layout/MainLayout.tsx`
- Change `pt-14` to `pt-12` for mobile to match the `h-12` header height

### Phase 4: Fix TokenLifecyclePanel Mobile Arrows

**File**: `src/components/FunMoney/TokenLifecyclePanel.tsx`
- Restructure the grid/flex layout so vertical arrows appear as separate elements between state cards on mobile
- Remove the wrapping `flex items-center` div that forces horizontal layout
- Use the grid itself to place arrows between cards

### Phase 5: Fix "5 Pillars" Grid for Small Screens

**File**: `src/pages/FunMoneyPage.tsx`
- Change the pillar grid from `grid-cols-5` to `grid-cols-3 sm:grid-cols-5`
- The last 2 pillars will wrap to a second row on very small screens, centered

### Phase 6: Fix MintRequestList Filter Overflow

**File**: `src/components/FunMoney/MintRequestList.tsx`
- Wrap filter buttons in a horizontally scrollable container
- Add `overflow-x-auto scrollbar-hide flex-nowrap` classes
- Change from `flex-wrap` to `flex-nowrap`

---

## Files Modified (Total: 6)

| File | Change | Priority |
|------|--------|----------|
| `src/hooks/useRewardRealtimeNotification.ts` | Fix subscription flapping with channelRef guard | Critical |
| `src/components/Layout/MobileHeader.tsx` | Remove Download button (available in drawer) | High |
| `src/components/Layout/MainLayout.tsx` | Fix pt-14 to pt-12 for mobile header alignment | High |
| `src/components/FunMoney/TokenLifecyclePanel.tsx` | Fix mobile arrow layout between states | Medium |
| `src/pages/FunMoneyPage.tsx` | Fix 5-pillar grid responsiveness | Medium |
| `src/components/FunMoney/MintRequestList.tsx` | Fix filter button overflow on mobile | Medium |

---

## Summary

The most critical issue found is the **Realtime subscription flapping** - the channel is rapidly connecting and disconnecting dozens of times per second. This wastes network resources and degrades performance. The fix adds a guard to prevent re-subscription loops.

The remaining fixes are mobile UX improvements: removing the overcrowded Download button from the header, fixing the header/content height mismatch, improving the lifecycle panel arrows on mobile, and fixing grid/filter overflow issues on small screens.

No database changes are needed. All fixes are frontend-only.
