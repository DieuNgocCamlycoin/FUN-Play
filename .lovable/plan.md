

# Social Media Orbit - Profile Avatar Thumbnails

## Overview
Thay the cac icon SVG trong vong tron nho xung quanh avatar bang hinh dai dien that cua user tren cac nen tang xa hoi. Cac vong tron se co kich thuoc lon hon (nhu trong hinh tham khao), vien mau dac trung cua nen tang, va xoay theo chieu kim dong ho.

## Architecture

### 1. Backend: Edge Function `fetch-social-avatar`
Tao edge function de lay hinh dai dien tu URL mang xa hoi cua user:
- Fetch HTML cua trang ca nhan user
- Extract Open Graph image (`og:image`) tu meta tags
- Fallback: platform favicon hoac icon mac dinh
- Tra ve URL hinh anh

### 2. Database: Cache avatars
Them cot `social_avatars` (JSONB) vao bang `profiles` de cache ket qua:
```text
{
  "facebook": "https://..../photo.jpg",
  "youtube": "https://..../avatar.jpg",
  "telegram": null,
  ...
}
```
- Tranh fetch lai moi lan load trang
- Tu dong cap nhat khi user thay doi URL mang xa hoi

### 3. Frontend: Updated SocialMediaOrbit
- Hien thi hinh dai dien that (tu cache) thay vi icon SVG
- Fallback ve icon SVG neu khong co hinh
- Vong tron lon hon: ~36x36px (mobile) va ~44x44px (desktop) - giong hinh tham khao
- Vien 3px mau dac trung cua nen tang
- Animation xoay cham theo chieu kim dong ho (CSS `@keyframes`)
- Hover: phong to + hien tooltip voi link toi trang ca nhan

### 4. Integration Flow
```text
User saves social URL in Settings
        |
        v
Edge function "fetch-social-avatar" duoc goi
        |
        v
Lay og:image tu URL -> luu vao profiles.social_avatars
        |
        v
SocialMediaOrbit doc tu social_avatars
        |
        v
Hien thi hinh tron voi avatar that + vien mau nen tang
```

---

## Technical Details

### Edge Function: `fetch-social-avatar`
- Input: `{ userId, platform, url }`
- Fetch URL voi `User-Agent` header de tranh bi block
- Parse HTML bang regex (nhe, khong can DOM parser) de tim `<meta property="og:image" content="...">`
- Luu ket qua vao `profiles.social_avatars` JSONB
- Rate limit: 1 request/platform/user/hour

### Database Migration
```text
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_avatars jsonb DEFAULT '{}';
```

### SocialMediaOrbit Changes
- Them prop `socialAvatars` (JSONB object)
- Moi vong tron: neu co avatar -> hien `<img>` trong vong tron, neu khong -> fallback ve icon SVG hien tai
- Tang kich thuoc vong tron tu 24-28px len 36-44px
- Them CSS animation `orbit-rotate` xoay cham (20s/vong)
- Hover effect: `scale(1.3)` + tooltip hien link

### ProfileHeader Changes
- Truyen `socialAvatars` tu profile data xuong `SocialMediaOrbit`

### Settings Integration
- Khi user luu/thay doi URL mang xa hoi -> goi edge function `fetch-social-avatar` de cap nhat cache

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/fetch-social-avatar/index.ts` | Create - Edge function lay OG image |
| `supabase/migrations/xxx_add_social_avatars.sql` | Create - Them cot social_avatars |
| `src/components/Profile/SocialMediaOrbit.tsx` | Modify - Hien avatar that, tang kich thuoc, them animation |
| `src/components/Profile/ProfileHeader.tsx` | Modify - Truyen socialAvatars prop |
| Settings page (noi luu social URLs) | Modify - Goi fetch-social-avatar khi luu |

