
# Fix Music Button Toggle After Drag

## Problem
After dragging the music button, tapping it no longer toggles play/pause. This is because `isDraggingRef` is set to `true` during drag but never reset, so every subsequent `onPointerUp` thinks a drag just happened and skips the `toggle()` call.

## Root Cause
- `onDrag` sets `isDraggingRef.current = true`
- `onPointerUp` checks `if (!isDraggingRef.current)` to call `toggle()`
- But `isDraggingRef` is never reset to `false` after drag ends
- So after the first drag, all taps are permanently ignored

## Fix

### File: `src/components/ValentineMusicButton.tsx`

**Single change** -- add `isDraggingRef.current = false` at the end of `onDragEnd`, using a small `setTimeout` so the reset happens after `onPointerUp` fires:

```
onDragEnd={() => {
  localStorage.setItem(POS_KEY, JSON.stringify({
    x: motionX.get(),
    y: motionY.get(),
  }));
  // Reset after a tick so onPointerUp (which fires first) still sees true for this drag
  setTimeout(() => {
    isDraggingRef.current = false;
  }, 0);
}}
```

This ensures:
1. During a drag: `onPointerUp` sees `isDraggingRef = true` and correctly skips toggle
2. After the drag completes: `isDraggingRef` resets to `false` so the next tap works
3. Autoplay continues to work as before since no autoplay logic is changed
