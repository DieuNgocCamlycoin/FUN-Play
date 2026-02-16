

# Music Playback -- Final Bug Fix

## Issue Found

In `BackgroundMusicPlayer.tsx`, the `togglePlay` function on line 51 manually sets `setIsPlaying(!isPlaying)` immediately when the user taps play/pause. However, the `<audio>` element also has `onPlay` and `onPause` event handlers (lines 113-114) that set the same state. This causes:

1. **Double state update** -- two `setIsPlaying` calls fire for every toggle action
2. **Incorrect UI on mobile** -- if `play()` fails (blocked by browser autoplay policy), the UI optimistically shows "playing" even though no audio is audible

## Fix

Remove the manual `setIsPlaying(!isPlaying)` from `togglePlay()` and rely solely on the native `onPlay`/`onPause` audio events, which only fire when playback actually starts or stops.

## Technical Details

### File: `src/components/BackgroundMusicPlayer.tsx`

Change `togglePlay` from:
```typescript
const togglePlay = () => {
  if (!audioRef.current) return;
  if (isPlaying) {
    audioRef.current.pause();
  } else {
    audioRef.current.play().catch(console.error);
  }
  setIsPlaying(!isPlaying); // <-- remove this line
};
```

To:
```typescript
const togglePlay = () => {
  if (!audioRef.current) return;
  if (isPlaying) {
    audioRef.current.pause();
  } else {
    audioRef.current.play().catch(console.error);
  }
};
```

### No other files need changes
### No database changes required
### No new dependencies required
