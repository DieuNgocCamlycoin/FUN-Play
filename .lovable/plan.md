

# ValentineMusicButton -- Remove Redundant State Updates

## Issue

The `toggle()` function in `ValentineMusicButton.tsx` manually sets `setIsPlaying(false)` on pause (line 213) and `setIsPlaying(true)` on play (line 222). But the `<audio>` element already has `onPlay` and `onPause` handlers (lines 290-291) that update the same state. This is the same double-update pattern we just fixed in `BackgroundMusicPlayer`.

Similarly, the `tryPlay()` callback (line 128) and the interaction-based fallback handler (line 164) also manually call `setIsPlaying(true)` -- these are redundant since `onPlay` will fire automatically.

## Fix

Remove all manual `setIsPlaying()` calls and let the native audio events be the single source of truth.

## Technical Details

### File: `src/components/ValentineMusicButton.tsx`

- **`toggle()` function (lines 198-230)**: Remove `setIsPlaying(false)` on line 213 and `setIsPlaying(true)` on line 222
- **`tryPlay()` callback (lines 120-142)**: Remove `setIsPlaying(true)` on lines 128 and 137
- **Interaction fallback handler (lines 150-180)**: Remove `setIsPlaying(true)` on line 164

The `onPlay` and `onPause` handlers on the audio element (lines 290-291) will handle all state updates reliably, only firing when playback actually starts or stops.

### No other files need changes
### No database changes required
### No new dependencies required

