

## Chuan hoa Video Player FUN PLAY giong YouTube 100%

### Phan tich so sanh

**Hien tai FUN PLAY (qua nhieu nut):**
- Bottom-left: SkipBack, RotateCcw, Play/Pause, RotateCw, SkipForward, Volume, Time
- Bottom-right: Shuffle, Repeat, Settings, PiP, Fullscreen
- Top: Title overlay + Close (X) button
- Tong cong: 12 nut tren overlay

**YouTube chuan (toi gian):**
- Bottom-left: Play/Pause, Next, Volume+slider, Time
- Bottom-right: Settings, Subtitles/PiP, Theater, Fullscreen
- Top: Khong co title, khong co X
- Tong cong: 7-8 nut

### Cac thay doi cu the

---

### Thay doi 1: Don dep bottom-left controls

**Tep**: `src/components/Video/EnhancedVideoPlayer.tsx`

**Xoa khoi overlay:**
- Nut RotateCcw (tua lui 10s) — da co double-click va phim J
- Nut RotateCw (tua toi 10s) — da co double-click va phim L

**Sap xep lai theo thu tu YouTube:**
1. Play/Pause
2. Prev (chi khi co queue/hasPrevious)
3. Next (chi khi co queue/hasNext)
4. Volume + slider
5. Time display

### Thay doi 2: Don dep bottom-right controls

**Xoa khoi overlay:**
- Nut Shuffle — chuyen vao Settings menu
- Nut Repeat — da co trong Settings menu roi

**Giu lai theo thu tu YouTube:**
1. Settings (gear icon)
2. PiP (mini player)
3. Theater mode (them vao player, hien tai nam ngoai Watch.tsx)
4. Fullscreen

### Thay doi 3: Don dep top layer

**Xoa:**
- Title overlay o top bar (YouTube khong hien title tren player)
- Top gradient

**Giu:**
- Close (X) button — giu lai vi FUN PLAY can nut quay ve trang chu (YouTube dung browser back)

### Thay doi 4: Them Theater mode vao player

**Van de**: Nut Theater mode hien dang nam ben ngoai player, trong Watch.tsx (duoi phan action buttons). Can them vao bottom-right cua player overlay.

**Giai phap**: Them prop `onTheaterToggle` va `isTheaterMode` vao EnhancedVideoPlayer, hien thi nut Theater o bottom-right (truoc Fullscreen).

### Thay doi 5: Gom Shuffle vao Settings menu

Chuyen Shuffle toggle vao trong DropdownMenu Settings, giong nhu Autoplay va Loop da co san.

### Thay doi 6: Them T keyboard shortcut cho Theater mode

Them phim T vao handleKeydown de toggle theater mode.

### Thay doi 7: An cursor khi dang phat

Them logic an cursor (`cursor-none`) khi controls bi an va video dang phat.

---

### Tom tat bo cuc moi

```text
+--------------------------------------------------+
| [X]                                              |  <- Top: chi Close button
|                                                  |
|                                                  |
|              (click = play/pause)                 |  <- Center: click toggle
|         (double-click trai = -10s)               |
|         (double-click phai = +10s)               |
|                                                  |
|  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  |  <- Progress bar
|  [▶] [⏮] [⏭] [🔊━━] 0:08/3:14   [⚙][🖼][▭][⛶] |  <- Bottom controls
+--------------------------------------------------+
```

Bottom-left: Play, Prev*, Next*, Volume+slider, Time
Bottom-right: Settings, PiP, Theater, Fullscreen

(*) Prev/Next chi hien khi co queue

### Danh sach tep thay doi

| STT | Tep | Noi dung |
|-----|-----|---------|
| 1 | `src/components/Video/EnhancedVideoPlayer.tsx` | Xoa RotateCcw/RotateCw, Shuffle, Repeat khoi overlay. Gom Shuffle vao Settings. Them Theater mode button + prop. Xoa title top bar. An cursor khi controls an. Them phim T. Sap xep lai thu tu nut. |
| 2 | `src/pages/Watch.tsx` | Truyen isTheaterMode va onTheaterToggle props xuong EnhancedVideoPlayer. Xoa nut Theater mode tu phan action buttons ben ngoai. |

### Ket qua

- Player overlay giong YouTube 90-100%
- Chi 7-8 nut thay vi 12
- Shuffle/Repeat/Speed/Ambient gom vao Settings
- Theater mode trong player
- Cursor an khi dang phat
- Phim tat T cho theater
- Prev/Next chi hien khi co queue

