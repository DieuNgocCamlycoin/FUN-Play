
# Plan: Fix "Tai ve" (Download) & "Chia se" (Share) cho AI Music

## Van de phat hien

### 1. Download - Loi blob download trong iframe
- Edge function `download-ai-music` hoat dong tot (Status 200, tra ve MP3 data)
- Nhung cach tao blob URL + click `<a>` de download co the khong hoat dong dung trong preview iframe
- Can chuyen sang dung `supabase.functions.invoke` voi `responseType` phu hop, kem fallback mo tab moi

### 2. Share - URL sai duong dan
- `ShareModal` tao link `/music/{id}` cho `contentType="music"` 
- Nhung route that su la `/ai-music/:id`
- Ket qua: link chia se dan den trang 404

### 3. Prerender - Thieu handler cho AI Music
- Prerender function nhan dien path `/ai-music/` nhung khong fetch du lieu tu bang `ai_generated_music`
- Chi co handler cho `music`/`video` (fetch tu bang `videos`) va `channel`
- Ket qua: khi share len mang xa hoi, OG meta tags hien thi thong tin mac dinh thay vi thong tin bai hat

## Giai phap

### Buoc 1: Fix ShareModal - Them content type "ai-music"

**File**: `src/components/Video/ShareModal.tsx`

- Them `'ai-music'` vao `ShareContentType`
- Sua `getShareUrl()`: khi `contentType === 'ai-music'` tra ve `/ai-music/${id}`
- Sua `getPrerenderUrl()`: khi `contentType === 'ai-music'` tra ve path `/ai-music/${id}`
- Sua `getContentTypeLabel()`: tra ve `'bai hat AI'` cho `ai-music`

### Buoc 2: Fix AIMusicDetail - Sua contentType va Download

**File**: `src/pages/AIMusicDetail.tsx`

- Doi `contentType="music"` thanh `contentType="ai-music"` trong ShareModal
- Cai thien `handleDownload`:
  - Dung `supabase.functions.invoke('download-ai-music', ...)` thay vi raw `fetch`
  - Them fallback: neu blob download that bai, mo URL truc tiep trong tab moi
  - Them loading state (spinner) khi dang tai

### Buoc 3: Fix Prerender - Them handler cho ai-music

**File**: `supabase/functions/prerender/index.ts`

- Them handler cho `type === "ai-music"`:
  - Fetch tu bang `ai_generated_music` (id, title, style, thumbnail_url, audio_url, play_count)
  - Set OG type = `music.song`
  - Set OG audio = `audio_url`
  - Tao title va description phu hop: `"{title}" - Fun Music AI`

## Chi tiet ky thuat

### ShareModal type update
```text
ShareContentType = 'video' | 'music' | 'channel' | 'ai-music'

getShareUrl():
  'ai-music' -> /ai-music/{id}

getPrerenderUrl():
  'ai-music' -> /ai-music/{id}
```

### Download flow cai tien
```text
User click "Tai ve"
  -> Set isDownloading = true
  -> supabase.functions.invoke('download-ai-music', { musicId })
  -> Convert response to blob
  -> Create blob URL + trigger download
  -> Fallback: window.open(audio_url) neu blob that bai
  -> Set isDownloading = false
```

### Prerender ai-music handler
```text
if (type === "ai-music")
  -> SELECT from ai_generated_music WHERE id = :id
  -> title = "{music.title} - Fun Music AI"
  -> description = "Nghe bai hat AI \"{music.title}\" tren FUN Play"
  -> image = music.thumbnail_url
  -> ogType = "music.song"
  -> audioUrl = music.audio_url
```

## Tom tat thay doi

| File | Thay doi |
|------|----------|
| `src/components/Video/ShareModal.tsx` | Them 'ai-music' content type + URL mapping |
| `src/pages/AIMusicDetail.tsx` | Doi contentType, cai thien handleDownload |
| `supabase/functions/prerender/index.ts` | Them ai-music handler fetch tu ai_generated_music |

**Tong cong**: 3 files can cap nhat
