

# Make Valentine Music Button Draggable

## Overview
Update the `ValentineMusicButton` component so users can drag it to any position on screen (both web and mobile). A short tap toggles music; a drag moves the button. Position is saved to `localStorage` so it persists across sessions.

## Changes

### File: `src/components/ValentineMusicButton.tsx`

1. **Use framer-motion's `drag` prop** on the `motion.button` element:
   - Add `drag` to enable free dragging in both axes
   - Add `dragConstraints` referencing the viewport to keep it on-screen
   - Add `dragElastic={0.1}` for a subtle bounce at edges
   - Add `dragMomentum={false}` for precise placement

2. **Distinguish tap vs drag**:
   - Track drag distance using `onDragStart` / `onDragEnd`
   - Only trigger `toggle()` (play/pause) if the drag distance is minimal (< 5px), otherwise treat it as a drag
   - Remove `onClick` and use `onTap` or manual click logic via drag events

3. **Persist position to localStorage**:
   - Save `{ x, y }` offset on `onDragEnd` to `localStorage` key `valentine-music-position`
   - On mount, read saved position and apply as initial `style={{ x, y }}` or via `motion` values
   - Use `useMotionValue` for x/y to smoothly initialize from saved position

4. **Viewport constraints**:
   - Use a ref on a full-screen invisible container div as `dragConstraints`, or calculate window bounds dynamically
   - Ensure the button stays visible and accessible after drag

## Technical Details

| What | How |
|------|-----|
| Drag support | `motion.button` with `drag`, `dragConstraints`, `dragElastic={0.1}`, `dragMomentum={false}` |
| Tap vs drag | Track pointer movement in `onDragEnd` — if total offset < 5px, call `toggle()` |
| Position persistence | Save to `localStorage("valentine-music-pos")` on drag end, restore on mount |
| Viewport bounds | Use `dragConstraints={{ top: 0, left: 0, right: window.innerWidth - 48, bottom: window.innerHeight - 48 }}` recalculated on resize |
| Touch support | framer-motion `drag` works natively with touch — no extra handling needed |

