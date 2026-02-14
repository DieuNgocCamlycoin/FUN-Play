

# Valentine's Day Background Music + Holographic Music Icon

## Overview
Add the uploaded Valentine's Day MP3 as auto-playing background music when users visit FUN Play, with the uploaded holographic music note icon as the toggle button. Music plays automatically on first visit and users can toggle it on/off. State persists via localStorage.

## Changes

### 1. Copy uploaded assets to the project
- Copy `VALENTINE.mp3` to `public/audio/valentine-bg.mp3`
- Copy `19.png` to `public/images/icon-music-valentine.png`

### 2. Create `src/components/ValentineMusicButton.tsx`
A floating button component that:
- Uses the holographic music note icon (uploaded image)
- Auto-plays `valentine-bg.mp3` on first visit (respecting browser autoplay policies with user interaction fallback)
- Loops the music continuously
- Toggles music on/off on click
- Saves mute preference to `localStorage` (`valentine-music-muted`)
- Animated pulse/glow effect when music is playing
- **Desktop**: Fixed position bottom-right corner (above other floating elements)
- **Mobile**: Fixed position bottom-left corner (to avoid conflict with bottom nav), slightly above the nav bar with `bottom: 5rem`
- Size: 48px touch target on mobile, 44px on desktop
- Uses `framer-motion` for smooth entrance animation and a subtle bounce/pulse when playing

### 3. Update `src/App.tsx`
- Import and render `<ValentineMusicButton />` inside `AppContent`, alongside other global elements (after `<BackgroundUploadIndicator />`)

## Technical Details

| File | Action | Description |
|------|--------|-------------|
| `public/audio/valentine-bg.mp3` | Create (copy) | Valentine background music file |
| `public/images/icon-music-valentine.png` | Create (copy) | Holographic music note icon |
| `src/components/ValentineMusicButton.tsx` | Create | Floating music toggle with autoplay, localStorage persistence, responsive positioning |
| `src/App.tsx` | Edit (1 import + 1 line) | Add `<ValentineMusicButton />` to global layout |

### Component behavior:
- On mount: check `localStorage` for mute state. If not muted, attempt `audio.play()`. If blocked by browser, listen for first user click/tap to start playback.
- On click: toggle play/pause, save state to localStorage
- Visual: the icon spins slowly when playing, stops when muted. Subtle pink/purple glow ring around the button.
- Audio element: `<audio>` with `loop` attribute, volume at 30% (background-appropriate level)

