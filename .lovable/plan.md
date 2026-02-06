

# Plan: Hoan Thien Tinh Nang Chia Se Bai Hat AI Music

## Van de da xac nhan

### 1. Prerender Edge Function chua duoc deploy (LOI CHINH)
- Test truc tiep tra ve **HTTP 404** - function khong ton tai tren server
- Khong co logs nao tu function nay
- Code va config.toml deu dung nhung function chua duoc deploy len server

**Hau qua**: Khi chia se len Facebook, Twitter, LinkedIn - bot cua mang xa hoi khong doc duoc thong tin bai hat (tieu de, hinh anh, mo ta) nen hien thi trang/loi.

### 2. Share URL su dung URL preview thay vi URL production
- `window.location.origin` trong moi truong preview tra ve URL noi bo cua Lovable
- Link chia se can dung URL chinh thuc (published URL) de nguoi nhan co the truy cap

### 3. Telegram/WhatsApp/Zalo dung direct URL
- Cac nen tang nay su dung shareUrl truc tiep (khong qua prerender)
- Nhung SPA (Single Page App) khong co OG tags cho bot doc -> preview ngheo nan

## Giai phap

### Buoc 1: Deploy lai Prerender Edge Function
- Su dung tool deploy de push function len server
- Verify bang cach goi truc tiep URL voi path `/ai-music/{id}`
- Dam bao tra ve HTML voi day du OG tags

### Buoc 2: Fix Share URL trong ShareModal
- Thay `window.location.origin` bang URL production cho chia se ra ngoai
- Su dung bien moi truong `VITE_SUPABASE_PROJECT_ID` hoac hardcode published URL
- Dam bao link chia se luon la URL chinh thuc ma nguoi dung co the truy cap

**File**: `src/components/Video/ShareModal.tsx`

Thay doi `getShareUrl()`:
- Su dung published URL (`https://official-funplay.lovable.app`) lam base URL cho chia se
- Giu `window.location.origin` cho truong hop fallback khi khong co published URL

### Buoc 3: Dung Prerender URL cho tat ca cac nen tang mang xa hoi
- Hien tai chi Facebook, Twitter, LinkedIn, Messenger dung prerenderUrl
- Them Telegram, WhatsApp, Zalo vao danh sach dung prerenderUrl
- Vì bot cua Telegram/Zalo cung can doc OG tags tu prerender

**File**: `src/components/Video/ShareModal.tsx`

Cap nhat `handleShare()`:
- Telegram: dung prerenderUrl thay vi shareUrl
- Zalo: dung prerenderUrl thay vi shareUrl  
- WhatsApp: dung prerenderUrl thay vi shareUrl

### Buoc 4: Test end-to-end
- Goi prerender function voi path ai-music de verify OG tags
- Test copy link
- Test chia se len Telegram, Facebook

## Chi tiet ky thuat

### Deploy prerender
- Function da co code dung (xu ly `/ai-music/` path, fetch tu bang `ai_generated_music`)
- Chi can deploy lai len server

### Share URL fix
```text
// Hien tai (SAI trong preview):
shareUrl = "https://id-preview--53abc96f...lovable.app/ai-music/xxx"

// Sau fix (DUNG):
shareUrl = "https://official-funplay.lovable.app/ai-music/xxx"
```

### Prerender URL cho social platforms
```text
// Hien tai:
Telegram -> shareUrl (bot khong doc duoc OG tags)
WhatsApp -> shareUrl (bot khong doc duoc OG tags)
Zalo -> shareUrl (bot khong doc duoc OG tags)

// Sau fix:
Telegram -> prerenderUrl (bot doc duoc OG tags day du)
WhatsApp -> prerenderUrl (bot doc duoc OG tags day du)  
Zalo -> prerenderUrl (bot doc duoc OG tags day du)
```

## Tom tat thay doi

| Hanh dong | Chi tiet |
|-----------|----------|
| Deploy edge function | `prerender` - deploy lai len server |
| Cap nhat ShareModal | Fix base URL + dung prerenderUrl cho moi nen tang |
| Test | Verify prerender function + test chia se |

**Tong cong**: 1 function deploy + 1 file cap nhat + testing

