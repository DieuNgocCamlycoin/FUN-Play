

# Display Holographic Notification & Message Icons on Web Header

## Overview
The mobile header already uses beautiful holographic icons for notifications and messages (`icon-bell-holographic.png` and `icon-chat-holographic.png`). The desktop (web) header currently uses plain Lucide icons (`Bell`, `MessageCircle`). This update will replace those plain icons with the same holographic images used on mobile, creating a consistent visual experience across both interfaces.

## Changes

### File: `src/components/Layout/Header.tsx`

1. **Notification icon (Bell)** -- Replace the Lucide `Bell` icon with the holographic bell image:
   - Swap `<Bell className="h-5 w-5" />` for `<img src="/images/icon-bell-holographic.png" alt="Thong bao" className="h-6 w-6 object-contain drop-shadow-md" />`
   - Keep the existing `NotificationBadge` component and positioning
   - Remove `hidden md:flex` class so it's always visible

2. **Messages icon (MessageCircle)** -- Replace the Lucide `MessageCircle` icon with the holographic chat image:
   - Swap `<MessageCircle className="h-5 w-5" />` for `<img src="/images/icon-chat-holographic.png" alt="Tin nhan" className="h-6 w-6 object-contain drop-shadow-md" />`

Both buttons retain their existing tooltip, navigation, and badge behavior -- only the icon visuals change.

## Technical Details

| What | File | Detail |
|------|------|--------|
| Replace Bell icon | `Header.tsx` ~line 303 | Use `/images/icon-bell-holographic.png` image |
| Replace MessageCircle icon | `Header.tsx` ~line 291 | Use `/images/icon-chat-holographic.png` image |
| No new dependencies | -- | Uses existing image assets from `public/images/` |

