

# Fix Valentine Music Button: Reliable Autoplay on All Devices

## Problem

The current music button tries to autoplay unmuted audio, which modern browsers (especially mobile Safari and Chrome) block silently. The `catch(() => {})` swallows the error without any fallback, so users see a non-spinning icon with no music and no way to know they need to interact.

Additionally, there is no handling for page reload or tab re-focus -- the music does not resume when a user returns to the page.

## Solution: Reliable Autoplay Pattern

Implement a three-tier autoplay strategy:

1. **Try unmuted autoplay** -- works on desktop browsers that allow it
2. **Fallback to muted autoplay** -- works on most mobile browsers, then show a subtle "Tap to unmute" prompt
3. **Fallback to interaction-based play** -- attach listeners to the first user touch/click to start playback

Also add `visibilitychange` listener so music resumes when user returns to the tab/app.

## Changes

### File: `src/components/ValentineMusicButton.tsx`

**1. Enhanced `tryPlay` function with muted fallback:**
- First attempt: `audio.play()` (unmuted)
- If blocked: set `audio.muted = true`, retry `audio.play()`
- If muted play works: show a small unmute indicator on the button
- If even muted fails: wait for user interaction (existing listener pattern)

**2. Add `showUnmuteHint` state:**
- When music is playing muted, show a small pulsing indicator or badge on the button so users know to tap it
- Tapping the button unmutes and dismisses the hint

**3. Add page visibility handler:**
- Listen for `visibilitychange` event
- When page becomes visible again and user hasn't muted: resume playback
- This handles tab switching, mobile app switching, and page reload scenarios

**4. Fix localStorage logic on fresh visits:**
- Currently `isMutedStored()` returns `false` on first visit (key doesn't exist), which is correct
- But after a user explicitly pauses, it stays muted forever -- add logic to reset on new sessions (using `sessionStorage` flag)

**5. Update toggle function:**
- When user taps while muted-autoplay is active: unmute instead of pause
- Clear the unmute hint

## Technical Details

```text
Autoplay Flow:
  Mount --> tryPlay()
    |
    +--> audio.play() succeeds? --> Done (playing unmuted)
    |
    +--> Failed --> audio.muted=true, audio.play()
           |
           +--> Succeeds? --> Show unmute hint, wait for tap
           |
           +--> Failed --> Attach click/touch/pointer listeners
                           First interaction --> audio.play()
```

### Visibility Handler
- On `visibilitychange` to "visible": if not user-muted and not playing, call `tryPlay()`
- On `visibilitychange` to "hidden": optionally pause (or keep playing in background)

### Session-based Mute Reset
- On mount, check if `sessionStorage` has a "visited" flag
- If not (new session/reload), clear the mute preference so music auto-starts fresh
- Set the "visited" flag in `sessionStorage`

## Files Changed

| File | Change |
|------|--------|
| `src/components/ValentineMusicButton.tsx` | Implement reliable autoplay with muted fallback, unmute hint, visibility handler, session reset |

## No Other Files Affected
The component is self-contained and already mounted in `App.tsx`. No other changes needed.

