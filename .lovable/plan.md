

# Final Music Optimization: Resolve Dual-Player Conflict

## Issue

The `ValentineMusicButton` renders globally in `App.tsx` and plays `/audio/valentine-bg.mp3`. Meanwhile, `BackgroundMusicPlayer` renders on Index, UserProfile, and Channel pages with per-user music URLs. When both are active, **two audio streams play at the same time**, which is a poor user experience and wastes resources.

Additionally, `BackgroundMusicPlayer` initializes `isPlaying` to `autoPlay` (true) before the browser actually starts playback -- if `play()` fails (common on mobile), the UI shows "playing" when nothing is audible.

## Plan

### Step 1: Hide ValentineMusicButton when BackgroundMusicPlayer is active

Create a lightweight React context (`MusicContext`) that tracks whether a page-level background music player is active. When it is, the `ValentineMusicButton` pauses and hides itself, giving priority to the page's own music.

- Create `src/contexts/MusicContext.tsx` with a simple provider exposing `{ isPageMusicActive, setPageMusicActive }`
- Wrap the app with `MusicProvider` in `App.tsx`
- In `BackgroundMusicPlayer`, call `setPageMusicActive(true)` on mount and `false` on unmount
- In `ValentineMusicButton`, read `isPageMusicActive` and skip rendering / pause audio when true

### Step 2: Fix BackgroundMusicPlayer state initialization

Change `useState(autoPlay)` to `useState(false)` so the UI correctly reflects that nothing is playing until `play()` succeeds. The `onPlay` callback already sets `isPlaying` to true when playback actually starts.

## Technical Details

### New file: `src/contexts/MusicContext.tsx`

A minimal context with:
- `isPageMusicActive: boolean`
- `setPageMusicActive: (active: boolean) => void`

### Modified: `src/App.tsx`

- Import and wrap with `MusicProvider`

### Modified: `src/components/BackgroundMusicPlayer.tsx`

- Call `setPageMusicActive(true)` on mount, `false` on cleanup
- Change `useState(autoPlay)` to `useState(false)`

### Modified: `src/components/ValentineMusicButton.tsx`

- Read `isPageMusicActive` from context
- When true: pause audio and return null (don't render button)
- When false: resume normal behavior

### No database changes required
### No new dependencies required

