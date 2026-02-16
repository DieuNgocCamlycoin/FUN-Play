

# Music Playback Optimization

## Issues Found

1. **toggleVolumeSlider has a state race condition** -- `openVolumeSlider()` is called inside `setShowVolumeSlider`'s updater function, which itself calls `setShowVolumeSlider(true)`. This creates competing state updates that can cause the slider to flicker or not appear.

2. **Audio preloads entire file unnecessarily** -- `preload="auto"` downloads the full MP3 on page load even before the user interacts. Using `preload="metadata"` reduces initial bandwidth.

3. **onCanPlayThrough causes redundant play attempts** -- Every time the audio buffer fills, `tryPlay()` fires again, even if audio is already playing. This wastes CPU cycles.

4. **Unnecessary AnimatePresence on the button** -- The button never unmounts, so wrapping it in `AnimatePresence` adds overhead with no benefit.

5. **Continuous rotation animation runs even when tab is hidden** -- The spinning icon animation keeps running in background tabs, wasting resources.

---

## Plan

### Step 1: Fix toggleVolumeSlider logic

Replace the nested state-update pattern with a simple check using a ref or reading current state directly:

```
const toggleVolumeSlider = useCallback(() => {
  if (showVolumeSlider) {
    closeVolumeSlider();
  } else {
    openVolumeSlider();
  }
}, [showVolumeSlider, openVolumeSlider, closeVolumeSlider]);
```

### Step 2: Optimize audio loading

- Change `preload="auto"` to `preload="metadata"` -- the audio will only fully buffer when play is triggered
- Remove the `onCanPlayThrough` handler since `tryPlay()` is already called on mount and via interaction listeners

### Step 3: Remove unnecessary AnimatePresence

Remove the `<AnimatePresence>` wrapper around the button (keep the one around the volume slider). The button uses `initial`/`animate` for its entrance but never exits.

### Step 4: Pause animation when tab is hidden

Add the `document.visibilityState` check to pause the spinning animation when the tab is not visible, reducing GPU usage in background tabs.

---

## Technical Details

### File: `src/components/ValentineMusicButton.tsx`

Changes:
- Fix `toggleVolumeSlider` to avoid nested `setState` calls
- Change `preload="auto"` to `preload="metadata"` on the audio element
- Remove `onCanPlayThrough={() => tryPlay()}` callback
- Remove outer `<AnimatePresence>` around the motion.button
- Add visibility-aware animation control for the spinning icon

### No other files need changes
### No database changes required
### No new dependencies required

