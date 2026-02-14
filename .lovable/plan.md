

# Fix Music Button Toggle and Mobile Autoplay

## Problem Analysis

Two distinct issues remain:

1. **Toggle not working on web**: Framer Motion's drag system internally captures and manages pointer events. The `onPointerUp` handler conflicts with this -- Framer Motion may suppress or re-route the event, making `toggle()` unreliable. The fix is to use Framer Motion's built-in `onTap` callback, which is specifically designed to work alongside `drag` and only fires on a clean tap (no drag movement).

2. **Mobile autoplay not working**: Mobile browsers (especially Safari/Chrome on iOS/Android) strictly block `audio.play()` unless it happens directly inside a user gesture handler. The current approach tries `play()` on mount and on the first document click, but these may fail because:
   - The `touch-none` CSS class (from `touch-action: none`) prevents touch events from propagating on the button itself
   - The first-interaction listener uses `click` and `touchstart` on `document`, but mobile browsers may not count these as valid gestures for audio unlock

## Solution

### File: `src/components/ValentineMusicButton.tsx`

1. **Replace `onPointerUp` with Framer Motion's `onTap`**
   - `onTap` is Framer Motion's native callback that fires only on a successful tap (not on drag). It integrates perfectly with the `drag` prop.
   - Remove `isDraggingRef`, `dragStartRef`, and all manual drag-vs-tap tracking -- `onTap` handles this automatically.
   - Simplify `onDragStart`/`onDrag` handlers since they are no longer needed for tap detection.

2. **Keep `onDragEnd` for position saving only** -- no changes needed there.

3. **Fix mobile autoplay**
   - Add `"pointerdown"` to the first-interaction listener alongside `click` and `touchstart`. Mobile browsers more reliably honor audio unlock from `pointerdown`.
   - Remove the `touch-none` CSS class from the button so touch events can propagate properly on mobile. The drag still works without it because Framer Motion handles drag via pointer events internally.

4. **Simplify the component** by removing unused refs (`dragStartRef`, `isDraggingRef`) that were part of the broken manual detection.

## Technical Summary

| Change | Why |
|--------|-----|
| `onTap={toggle}` replaces `onPointerUp` | Framer Motion's native tap-vs-drag detection, 100% reliable |
| Remove `isDraggingRef` and manual tracking | No longer needed with `onTap` |
| Remove `touch-none` class | Allows touch events to propagate for mobile audio unlock |
| Add `pointerdown` listener for autoplay | More reliable user gesture detection on mobile browsers |

Single file change: `src/components/ValentineMusicButton.tsx`
