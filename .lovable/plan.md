

## Sua 4 loi Social Media Orbit + Toi uu Mobile & Edge Function

### Tong quan

Sua 4 loi trong he thong Social Media Orbit: (1) vong tron khong cach deu, (2) avatar chi hien YouTube, (3) tooltip thieu link, (4) mobile touch khong hien tooltip. Dong thoi toi uu edge function de loc favicon/logo chung.

---

### Thay doi 1: SocialMediaOrbit.tsx - Sua cong thuc goc 360/count

**Van de hien tai:** Dung `startAngle=30, endAngle=330` chia 300 do, tao khoang trong khong deu o dinh.

**Giai phap:** Chia deu 360 do, bat dau tu vi tri 12h (270 do):
- 1 vong tron: dat tai 270 do (dinh 12h)
- 2 vong tron: 270 do va 90 do (doi xung doc)
- 3+ vong tron: 360/count, offset nua buoc tu 270 do de tranh diamond badge

```typescript
const count = activePlatforms.length;
const step = 360 / count;
// 1 item: dat tai 12h (270). 2+ items: offset nua buoc tu 12h de tranh diamond
const baseAngle = count === 1 ? 270 : (count === 2 ? 225 : 270 + step / 2);
// ...
const angle = baseAngle + step * index;
```

Ket qua:
- 1 vong: 270 do (12h chinh xac)
- 2 vong: 225 do va 315 do (doi xung qua truc doc, ne diamond)
- 4 vong: 315, 45, 135, 225 (can doi 4 goc)
- 9 vong: cach deu 40 do

---

### Thay doi 2: SocialMediaOrbit.tsx - Tooltip hien link + ho tro mobile tap

**Van de:** Tooltip chi hien ten nen tang, mobile khong hover duoc.

**Giai phap:**
- Them URL vao tooltip content
- Dung `delayDuration={0}` de tap tren mobile mo tooltip ngay
- Link trong tooltip co padding du lon (min 44px touch target)
- Tooltip co `max-w-[280px]` va truncate URL dai

```typescript
<TooltipContent side="bottom" className="text-xs max-w-[280px] p-2">
  <div className="font-semibold">{platform.label}</div>
  <div className="text-muted-foreground truncate text-[10px] mt-0.5 min-h-[20px]">
    {urls[platform.key]}
  </div>
</TooltipContent>
```

---

### Thay doi 3: fetch-social-avatar/index.ts - Loc favicon va anh nho

**Van de:** Edge function luu favicon (16x16px) va logo chung lam "avatar", hien thi xau tren UI.

**Giai phap:**

1. Them ham `isJunkImage()` kiem tra URL pattern:
   - Chua "favicon" hoac ket thuc ".ico"
   - Chua "/img/t_logo" (Telegram logo chung)
   - Chua "static/images/logo" (generic logos)

2. Xoa hoan toan `platformFavicons` map - KHONG bao gio luu favicon lam avatar. Khi khong co og:image that, tra ve `null` de frontend hien icon nen tang.

3. Logic moi:
```typescript
function isJunkImage(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("favicon") ||
         lower.endsWith(".ico") ||
         lower.includes("/img/t_logo") ||
         lower.includes("static/images/logo") ||
         lower.includes("default_profile") ||
         lower.includes("placeholder");
}

// Trong vong lap xu ly:
const ogImage = extractOgImage(html);
avatars[platform] = ogImage && !isJunkImage(ogImage) ? ogImage : null;
```

Luu y: Kiem tra kich thuoc anh (64x64) trong edge function khong kha thi vi can tai anh ve va decode - ton thoi gian va tai nguyen. Thay vao do, loc bang URL pattern da du hieu qua (favicon, .ico, logo chung).

---

### Thay doi 4: Xac nhan funplay_url

Kiem tra database cho thay `funplay_url` cua user `angelthuha` dang la `null`. User co the da nhap link nhung chua nhan Luu. Day KHONG phai loi code - chi can user nhap lai va nhan Luu. Code luu funplay_url tai `ProfileSettings.tsx` dong 402 da dung.

---

### Danh sach file thay doi

| STT | File | Thao tac |
|-----|------|----------|
| 1 | `src/components/Profile/SocialMediaOrbit.tsx` | SUA - cong thuc goc 360/count, tooltip voi URL, mobile touch |
| 2 | `supabase/functions/fetch-social-avatar/index.ts` | SUA - loc favicon/logo, xoa platformFavicons, chi luu avatar that |

