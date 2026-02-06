
# Plan: Triển Khai Hệ Thống "Tạo Nhạc Ánh Sáng" (Fun Music AI V3)

## Tổng Quan

Triển khai package "Fun Music AI V3" hoàn chỉnh - hệ thống tạo nhạc AI sử dụng Suno API với giao diện "Nhạc Ánh Sáng" (nền sáng, tràn đầy năng lượng).

## Hiện Trạng vs Yêu Cầu

| Thành phần | Hiện tại | Cần làm |
|------------|----------|---------|
| Bảng `ai_generated_music` | Chưa có | Tạo mới + RLS + Realtime |
| Bảng `ai_music_likes` | Chưa có | Tạo mới + RLS + Trigger |
| Edge Function `generate-suno-music` | Chưa có | Tạo mới (gọi Suno API) |
| Edge Function `generate-suno-music-callback` | Chưa có | Tạo mới (webhook nhận kết quả) |
| Edge Function `generate-lyrics` | Chưa có | Tạo mới (Lovable AI tạo lời) |
| Edge Function `download-ai-music` | Chưa có | Tạo mới (tải nhạc có auth) |
| Edge Function `prerender` | Có (videos only) | Cập nhật thêm `/ai-music/` path |
| Hook `useAIMusic.ts` | Chưa có | Tạo mới |
| Hook `useMusicCompletionNotification.ts` | Chưa có | Tạo mới |
| Hook `useAIMusicDetail.ts` | Chưa có | Tạo mới |
| Hook `useMusicListeners.ts` | Chưa có | Tạo mới |
| Component `SunoModeForm.tsx` | Chưa có | Tạo mới |
| Utility `musicGradients.ts` | Chưa có | Tạo mới (Dark + Light gradients) |
| Page `CreateMusic.tsx` | Có (dùng ElevenLabs cũ) | Cập nhật tích hợp SunoModeForm |
| Page `MyAIMusic.tsx` | Chưa có | Tạo mới |
| Page `AIMusicDetail.tsx` | Chưa có | Tạo mới (giao diện Nhạc Ánh Sáng) |
| CSS animations | Chưa có | Thêm `bg-gradient-radial`, `animate-light-pulse` |
| Routes | Chỉ có `/create-music` | Thêm `/my-ai-music`, `/ai-music/:id` |
| Secret `SUNO_API_KEY` | Chưa có | Cần yêu cầu nhập |

## Các Bước Triển Khai

### Bước 1: Database Migration

Tạo 2 bảng mới với RLS policies, triggers, và enable Realtime:

- **`ai_generated_music`**: Lưu trữ bài hát AI (id, user_id, title, prompt, lyrics, style, voice_type, instrumental, audio_url, thumbnail_url, duration, status, is_public, play_count, like_count...)
- **`ai_music_likes`**: Bảng like với trigger tự động cập nhật `like_count`
- Enable Realtime cho notifications khi bài hát hoàn thành

### Bước 2: Yêu cầu SUNO_API_KEY

Hỏi người dùng nhập API key từ sunoapi.org (bắt buộc để tạo nhạc AI).

### Bước 3: Tạo Edge Functions (4 mới)

| Edge Function | Chức năng |
|---------------|-----------|
| `generate-suno-music` | Gọi Suno API V4.5, set callbackUrl, cập nhật status |
| `generate-suno-music-callback` | Nhận webhook khi nhạc xong, update DB |
| `generate-lyrics` | Dùng Lovable AI (Gemini) tạo lời bài hát |
| `download-ai-music` | Proxy download có xác thực user |

### Bước 4: Cập nhật Edge Function `prerender`

Thêm xử lý path `/ai-music/:id` để share link AI Music trên social media.

### Bước 5: Tạo Utility - musicGradients.ts

Hệ thống gradient theo thể loại nhạc:
- **Dark gradients** (`styleGradients`): Cho modal, mini player
- **Light gradients** (`lightStyleGradients`): Cho trang chi tiết Nhạc Ánh Sáng
- Utility functions: `detectMusicStyle()`, `getMusicGradient()`, `getGradientFromId()`

### Bước 6: Tạo Frontend Hooks (4 hooks)

| Hook | Chức năng |
|------|-----------|
| `useAIMusic` | CRUD, mutations, polling khi pending, like/unlike |
| `useMusicCompletionNotification` | Realtime toast khi bài hát hoàn thành |
| `useAIMusicDetail` | Fetch chi tiết 1 bài hát |
| `useMusicListeners` | Realtime Presence đếm người đang nghe |

### Bước 7: Tạo Components

- **`SunoModeForm.tsx`**: Form tạo nhạc với title, prompt, style, lyrics (AI generate), instrumental toggle, public toggle, metatag hints

### Bước 8: Tạo/Cập nhật Pages

| Page | Loại | Mô tả |
|------|------|-------|
| `CreateMusic.tsx` | Cập nhật | Tích hợp SunoModeForm thay thế logic ElevenLabs cũ |
| `MyAIMusic.tsx` | Tạo mới | Grid quản lý bài hát + LyricsModal + status indicator |
| `AIMusicDetail.tsx` | Tạo mới | Full-screen player với giao diện Nhạc Ánh Sáng (nền sáng) |

### Bước 9: Cập nhật App.tsx

- Thêm routes: `/my-ai-music`, `/ai-music/:id`
- Thêm `useMusicCompletionNotification()` hook

### Bước 10: Thêm CSS Animations

Thêm vào `index.css`:
- `.bg-gradient-radial`: Radial gradient cho hiệu ứng ánh sáng tỏa
- `.animate-light-pulse`: Animation nhịp thở ánh sáng

### Bước 11: Cập nhật config.toml

Thêm cấu hình cho 4 edge functions mới.

## Chi tiết kỹ thuật

### Luồng tạo nhạc

```text
User -> SunoModeForm -> Insert DB (status: pending)
                            |
                            v
              generate-suno-music (Edge Function)
              -> Update status: "processing"
              -> Call Suno API v4.5 with callbackUrl
              -> Return taskId
                            |
                            v (1-3 phut)
              Suno API -> Webhook ->
              generate-suno-music-callback
              -> Update DB: audio_url, thumbnail_url, duration
              -> Set status: "completed"
                            |
                            v
              Supabase Realtime
              -> useMusicCompletionNotification
              -> Toast: "Bai hat da xong!"
```

### Giao dien "Nhac Anh Sang" (V3)

```text
+-----------------------------------------------+
| Nen sang voi Light Gradients                   |
| (from-pink-200 via-rose-100 to-white)          |
|                                                 |
|   [Radial glow tu trung tam]                   |
|   [animate-light-pulse]                         |
|                                                 |
|   Text: text-gray-800 (dam tren nen sang)      |
|   Buttons: bg-gray-900/10                       |
|   Progress: bg-gray-300                         |
|   Playing bars: bg-gray-700                     |
+-----------------------------------------------+
```

## Tom tat file thay doi

| Loai | So luong | Files |
|------|----------|-------|
| Database migration | 1 | 2 bang + RLS + triggers + realtime |
| Edge Functions moi | 4 | generate-suno-music, callback, lyrics, download |
| Edge Function cap nhat | 1 | prerender |
| Hooks moi | 4 | useAIMusic, useMusicCompletionNotification, useAIMusicDetail, useMusicListeners |
| Component moi | 1 | SunoModeForm.tsx |
| Utility moi | 1 | musicGradients.ts |
| Page moi | 2 | MyAIMusic.tsx, AIMusicDetail.tsx |
| Page cap nhat | 1 | CreateMusic.tsx |
| Config cap nhat | 2 | App.tsx, supabase/config.toml |
| CSS cap nhat | 1 | index.css |

**Tong cong**: 8 files moi + 5 files cap nhat + 1 migration + 1 secret can nhap
