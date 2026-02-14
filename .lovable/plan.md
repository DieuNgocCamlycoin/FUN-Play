

# Fix Mobile Autoplay for Valentine Music Button

## Problem
On mobile browsers, music does not automatically play when users open Fun Play. Mobile browsers (Safari, Chrome) have strict autoplay policies that require audio to be initiated from a **direct, synchronous user gesture**. The current implementation has two issues:

1. The document-level interaction listeners (`click`, `touchstart`, `pointerdown`) fire and set `hasInteracted = true`, but `audio.play()` may still be rejected by the browser because the call is not directly inside the gesture handler's synchronous call stack.
2. Once `hasInteracted` becomes `true`, the listeners are never re-registered, so the user has no second chance to unlock audio.

## Solution

### File: `src/components/ValentineMusicButton.tsx`

1. **Remove `hasInteracted` guard from the interaction listener** -- instead, keep retrying on every user interaction until audio actually plays successfully. Only stop listening once `audio.play()` resolves.

2. **Add audio unlock on the button's own `onTap`** -- if audio isn't playing and the user taps the music button, try to play (in addition to toggle logic). This is the most reliable gesture source on mobile since it's a direct tap.

3. **Update `toggle()` to handle first-play scenario** -- when the user taps the button and music isn't playing yet (never started), treat it as an unlock + play attempt rather than requiring a separate "first interaction".

4. **Keep the document-level listeners as fallback** -- they work well on desktop and help on some mobile browsers. But now they retry until successful instead of giving up after the first attempt.

### Key changes:
- Remove `hasInteracted` state entirely (simplifies logic)
- Use a ref (`audioUnlockedRef`) to track whether audio has been successfully played at least once
- Document listeners keep firing until audio unlocks, then remove themselves
- `toggle()` works correctly regardless of whether audio was previously unlocked
- No other files are changed

