

# Fix Music Button Volume Control

## Issues Found

1. **Slider component doesn't support vertical orientation** -- The `Slider` UI component only has horizontal styles. Passing `orientation="vertical"` to Radix works at the API level, but the track/range CSS assumes horizontal layout (`h-2 w-full`, `h-full` for range). The vertical slider likely renders incorrectly or not at all.

2. **Volume slider position is stale after dragging** -- The slider popup uses `motionX.get()` / `motionY.get()` at render time to set its `style.left/top`. These are Framer Motion values that update outside React's render cycle, so the popup position won't follow the button if dragged.

3. **Long-press conflicts with drag** -- Both long-press and drag use `onPointerDown`. If the user starts a long press but moves slightly, it triggers both the volume slider AND a drag, creating a janky experience.

4. **Volume slider pointer events leak** -- `e.stopPropagation()` on the slider div doesn't prevent the slider from triggering the document-level click/touch listeners (used for audio unlock), potentially causing unintended behavior.

---

## Plan

### Step 1: Update Slider component for vertical support

Modify `src/components/ui/slider.tsx` to conditionally apply vertical styles when `orientation="vertical"` is passed. This includes:
- Changing flex direction to column
- Swapping width/height for track and range
- Adjusting thumb positioning

### Step 2: Fix volume slider positioning

Replace static `style={{ left, top }}` with a React state that updates whenever the volume slider opens. Read `motionX.get()` and `motionY.get()` at the moment of opening (inside `toggleVolumeSlider`) and store them in a `sliderPos` state. This ensures the popup always appears at the button's current position.

### Step 3: Separate long-press from drag

Add a movement threshold check: track pointer position on `pointerdown` vs `pointermove`. If the pointer moves more than 5px before the 500ms timer fires, cancel the long-press and let the drag proceed. This cleanly separates the two gestures.

### Step 4: Simplify and optimize

- Remove duplicate `volume / 100` calculations scattered throughout -- centralize in the volume `useEffect`
- Clean up the `tryPlay` dependency on `volume` (it causes the effect and event listeners to re-register every time volume changes). Instead, read volume from a ref inside those callbacks.
- Ensure the interaction-based unlock listeners only register once (not on every volume change)

---

## Technical Details

### Files to Modify

- **`src/components/ui/slider.tsx`** -- Add vertical orientation support
- **`src/components/ValentineMusicButton.tsx`** -- Fix positioning, gesture conflicts, and optimize re-renders

### Changes to `slider.tsx`

Add conditional classes based on `orientation` prop:
- Horizontal (default): current styles unchanged
- Vertical: `flex-col h-full w-fit`, track becomes `w-2 h-full`, range uses `w-full` instead of `h-full`

### Changes to `ValentineMusicButton.tsx`

1. Add `volumeRef` to track current volume without re-registering effects
2. Store slider popup position in state, computed when slider opens
3. Add `pointerStartPos` ref and `pointermove` listener to detect drag vs long-press
4. Remove `volume` from `tryPlay` and interaction-listener dependency arrays
5. Keep all existing drag, tap, and play/pause behavior intact

### No Database Changes Required
### No New Dependencies Required

