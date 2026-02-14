

# Fix Music Autoplay After Page Reload (Mobile)

## Problem
After reloading the page on mobile, the music button does not automatically resume playing. The root causes are:

1. **Audio element not ready on mount**: `tryPlay()` fires immediately on mount, but the audio file may not have loaded yet (especially on mobile with slower connections). The `play()` call fails silently.
2. **No `canplaythrough` listener**: There is no retry when the audio finishes loading -- if the initial `tryPlay()` fails because the audio isn't buffered, there's no second attempt before the user interacts.
3. **Autoplay success not persisted**: When autoplay succeeds (via mount or first interaction), `localStorage` is never set to `"false"`. This means the system has no record that the user wants music playing. Setting it explicitly ensures consistent behavior across reloads.

## Solution

### File: `src/components/ValentineMusicButton.tsx`

1. **Add `canplaythrough` event listener on the audio element** -- when the audio finishes buffering, call `tryPlay()` again. This catches the case where `tryPlay()` on mount failed because the audio wasn't loaded yet. On desktop this fires almost immediately; on mobile it fires once enough data is buffered.

2. **Persist "not muted" state on successful autoplay** -- in `tryPlay()` and in the interaction handler, after `audio.play()` succeeds, also call `localStorage.setItem(STORAGE_KEY, "false")`. This ensures that after reload, the system knows the user had music on.

3. **Add a retry with delay for mobile** -- add a second `tryPlay()` attempt after a short delay (e.g., 1.5s) to catch cases where the audio element is ready but the browser's autoplay policy check was too early.

### Changes summary:

| Change | Purpose |
|--------|---------|
| Add `onCanPlayThrough` handler on `<audio>` | Retry play when audio finishes loading |
| `localStorage.setItem(STORAGE_KEY, "false")` on autoplay success | Persist "music on" state for reloads |
| Add delayed retry `setTimeout(tryPlay, 1500)` | Catch edge cases on slow mobile loads |

Single file change, no new dependencies.

