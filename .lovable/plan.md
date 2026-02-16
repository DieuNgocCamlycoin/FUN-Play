
# Replace Background Music and Add Volume Control

## What We'll Do

1. **Replace the background music** with the new uploaded file (`Nhạc_hiệu_2.mp3`)
2. **Add a volume slider** that appears when tapping/clicking the music button -- lets users adjust volume smoothly
3. **Persist volume preference** in localStorage so volume is remembered between sessions
4. **Optimize for mobile** with touch-friendly slider and compact layout

---

## Implementation Details

### Step 1: Copy New Audio File
- Copy `user-uploads://Nhạc_hiệu_2.mp3` to `public/audio/valentine-bg.mp3` (replacing the existing file)

### Step 2: Update `ValentineMusicButton.tsx`

**Add volume control state:**
- New state: `volume` (0-100), `showVolumeSlider` (boolean)
- Persist volume in localStorage (`valentine-music-volume`)
- Apply volume to audio element via `audioRef.current.volume = volume / 100`

**Add volume slider UI:**
- On long-press or double-tap: show a small vertical volume slider near the button
- Slider uses the existing `@radix-ui/react-slider` component (already installed)
- Auto-hide slider after 3 seconds of no interaction
- Slider positioned above the button on mobile, beside it on desktop

**Interaction model:**
- Single tap: toggle play/pause (existing behavior, unchanged)
- Long-press (500ms) or double-tap: show/hide volume slider
- Drag: move button (existing behavior, unchanged)

**Volume persistence:**
- Save volume to `localStorage` on change
- Load saved volume on mount (default: 50%)

### Step 3: Optimize for Performance
- Use `useRef` for the volume slider hide timer to avoid re-renders
- Volume changes applied directly to `audioRef.current.volume` (no state-driven re-render needed for audio updates)
- Slider only renders when `showVolumeSlider` is true (conditional mount)

---

## Technical Details

### Files to Modify
- **`public/audio/valentine-bg.mp3`** -- replaced with new audio file
- **`src/components/ValentineMusicButton.tsx`** -- add volume slider, long-press detection, volume persistence

### No Database Changes Required
### No New Dependencies Required (uses existing `@radix-ui/react-slider`)
