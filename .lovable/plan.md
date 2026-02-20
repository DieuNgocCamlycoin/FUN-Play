
## Sua Social Media Orbit: Dung xoay khi hover, mau vien #00E7FF, avatar proxy, don dep code

### Tong quan
4 thay doi chinh: (1) dung orbit khi hover/tap de tooltip co dinh, (2) mau vien thong nhat #00E7FF, (3) edge function dung unavatar.io proxy de lay avatar tu cac nen tang bi chan, (4) don dep code thua.

---

### Thay doi 1: SocialMediaOrbit.tsx - Dung xoay khi hover + mau vien + don dep

**A. Dung orbit khi hover/tap:**

Them class `group` vao container orbit, va them CSS rule trong `index.css` de pause animation khi hover:

```css
/* index.css - them vao sau @keyframes orbit-counter-spin */
.orbit-container:hover {
  animation-play-state: paused !important;
}
.orbit-container:hover .orbit-item {
  animation-play-state: paused !important;
}
```

Thay class cua container tu arbitrary animate thanh class co ten:
```typescript
className="absolute inset-0 orbit-container animate-[orbit-spin_25s_linear_infinite]"
```

Them class `orbit-item` vao moi vong tron nho de dong bo pause.

**B. Mau vien dong nhat #00E7FF:**

Thay dong 121-125:
```typescript
// Cu: border: `3px solid ${platform.color}`
// Moi:
border: "3px solid #00E7FF",
boxShadow: "0 0 8px #00E7FF40",
```

Icon ben trong VAN giu `platform.color` de nhan dien nen tang (dong 131).

**C. Don dep:**

Trong mang `platforms` (dong 53-63), truong `color` van can thiet cho icon ben trong va OrbitImage fallback. Khong xoa duoc vi van dung o dong 129 va 131. Tuy nhien, co the xoa `platform.color` khoi style border/boxShadow vi da hardcode `#00E7FF`.

---

### Thay doi 2: index.css - Them CSS hover pause

Them sau dong 793:
```css
/* Pause orbit on hover/tap for stable tooltips */
.orbit-container:hover {
  animation-play-state: paused !important;
}
.orbit-container:hover .orbit-item {
  animation-play-state: paused !important;
}
```

Uu diem: CSS hover tuong thich voi mobile touch event (tap giu), va `animation-play-state: paused` giu vi tri hien tai thay vi reset ve 0.

---

### Thay doi 3: fetch-social-avatar/index.ts - Dung unavatar.io proxy

**Van de:** Facebook, Telegram, Fun Profile chan scraping og:image. Can mot proxy de lay avatar.

**Giai phap:** Dung `unavatar.io` - dich vu mien phi lay avatar tu nhieu nen tang. Truoc khi scrape truc tiep, thu lay tu unavatar truoc:

Logic moi:
```typescript
// Trich username tu URL
function extractUsername(platform: string, url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "").split("/").pop();
    return path && path.length > 0 ? path : null;
  } catch { return null; }
}

// Thu unavatar truoc, roi fallback ve scrape og:image
async function fetchAvatar(platform: string, url: string): Promise<string | null> {
  const username = extractUsername(platform, url);
  
  // Map platform key to unavatar source
  const unavatarMap: Record<string, string> = {
    facebook: "facebook",
    twitter: "twitter", 
    youtube: "youtube",
    telegram: "telegram",
    tiktok: "tiktok",
    linkedin: "linkedin",
    github: "github",
  };
  
  // Try unavatar.io first (fast, reliable proxy)
  if (username && unavatarMap[platform]) {
    const unavatarUrl = `https://unavatar.io/${unavatarMap[platform]}/${username}`;
    try {
      const res = await fetch(unavatarUrl, { method: "HEAD", redirect: "follow" });
      if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
        return unavatarUrl;
      }
    } catch {}
  }
  
  // Fallback: scrape og:image from URL
  // ... (giu logic hien tai)
}
```

Cach nay:
- Facebook, Twitter, Telegram: unavatar.io lay avatar thanh cong
- YouTube: van dung og:image (da hoat dong)
- AngelAI, FunPlay: khong co trong unavatar -> fallback ve og:image scrape -> neu khong co thi tra ve null -> hien icon thuong hieu

---

### Danh sach file thay doi

| STT | File | Thao tac |
|-----|------|----------|
| 1 | `src/components/Profile/SocialMediaOrbit.tsx` | SUA - them orbit-container/orbit-item class, border #00E7FF, don dep |
| 2 | `src/index.css` | SUA - them CSS hover pause cho orbit |
| 3 | `supabase/functions/fetch-social-avatar/index.ts` | SUA - them unavatar.io proxy, giu fallback og:image |

### Luu y tuong thich

- **Web**: Hover vao vong tron -> orbit dung -> tooltip co dinh
- **Mobile**: Touch/tap -> CSS :hover trigger tuong tu -> orbit dung -> tooltip hien
- `delayDuration={0}` da co tu truoc -> tooltip hien ngay khi tap
- `max-w-[280px]` va `truncate` bao ve layout tren mobile
