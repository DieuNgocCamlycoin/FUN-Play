

## Chuan hoa URL va loai bo hoan toan duong dan `/user/:id` cu

### Hien trang

He thong **da co san** cau truc URL chuyen nghiep:
- Trang ca nhan: `/c/:username` (tuong tu YouTube)
- Video: `/c/:username/video/:slug` (voi slug khong dau)
- Ham `slugify()` da co trong `src/lib/slugify.ts`
- Username da duoc dam bao duy nhat trong database (validation khi user dat username)

**Van de**: Nhieu component van dung duong dan cu `/user/${userId}` thay vi `/c/${username}`, gay ra loi 404 hoac URL khong dep.

### Tai sao KHONG dung `/:username`?

Route `/:username` se **xung dot** voi tat ca route khac cua ung dung (`/admin`, `/wallet`, `/shorts`, `/settings`...). Day la ly do cac nen tang lon deu dung prefix:
- YouTube: `/c/username` hoac `/@username`
- FUN PLAY: `/c/username` (da co san)

### Ke hoach thay doi

#### 1. Cap nhat `adminUtils.ts` - Dung duong dan tuong doi

```typescript
export function getProfileUrl(username?: string | null, userId?: string): string | null {
  const identifier = username || userId;
  if (!identifier) return null;
  return `/c/${identifier}`;  // Bo production URL, dung duong dan tuong doi
}
```

#### 2. Chuyen doi 8 file dung `/user/${userId}` sang `/c/${username}`

| File | Thay doi |
|------|---------|
| `Header.tsx` | `/user/${user.id}` -> `/c/${profile?.username \|\| user.id}` |
| `ChatHeader.tsx` | `/user/${otherUser.id}` -> `/c/${otherUser.username \|\| otherUser.id}` |
| `TransactionCard.tsx` | `/user/${sender_user_id}` -> `/c/${sender_username \|\| sender_user_id}` |
| `UserProfileDisplay.tsx` | `/user/${userId}` -> `/c/${username}` (da co prop username) |
| `TopSponsorsSection.tsx` | `/user/${sponsor.userId}` -> `/c/${sponsor.username \|\| sponsor.userId}` |
| `DonationSuccessOverlay.tsx` | `/user/${sender.id}` -> `/c/${sender.username \|\| sender.id}` |
| `GiftCelebrationModal.tsx` | `/user/${sender.id}` -> `/c/${sender.username \|\| sender.id}` |
| `UserStatsTab.tsx` | Nut "Xem Profile" `/user/${user.user_id}` -> dung `getProfileUrl()` |

#### 3. Chuyen dong `/u/:username` ve `/c/:username`

Trong `App.tsx`:
- Xoa route `/u/:username` rieng
- Them redirect: `/u/:username` -> Navigate to `/c/:username`
- Giu route `/user/:userId` lam redirect ve `/c/:userId` (tuong thich nguoc)

#### 4. Cap nhat cac file donation dung `/u/` sang `/c/`

| File | Thay doi |
|------|---------|
| `DonationCelebrationCard.tsx` | `/u/${sender_username}` -> `/c/${sender_username}` |
| `ChatDonationCard.tsx` | `/u/${sender_username}` -> `/c/${sender_username}` |

#### 5. Lam sach code cu

- Xoa file `src/pages/UserProfile.tsx` (khong con route nao tro den)
- Chuyen tat ca logic hien thi profile ve `Channel.tsx` (da xu ly ca username va userId)
- Xoa import `UserProfile` trong `App.tsx`

#### 6. Ve username trung lap

He thong **da co san** validation unique cho username trong database (cot `username` la UNIQUE). Khi user dat username moi, he thong kiem tra realtime xem da ton tai chua. Neu 2 nguoi cung muon ten "thuha":
- Nguoi dau: `thuha` (duoc chap nhan)
- Nguoi sau: He thong bao "Username da ton tai", user phai chon ten khac (vi du `thuha1`, `thuha2`)

Viec tu dong them so (thuha-1, thuha-2) **khong nen ap dung** vi se gay nhap nham - user khong biet minh la `thuha` hay `thuha-1`. Cach hien tai (bat user chon ten khac) la chuyen nghiep hon.

### Tong ket

- **10 file** duoc cap nhat de dong bo URL
- **1 file** bi xoa (`UserProfile.tsx` - logic da co trong `Channel.tsx`)
- Tat ca link deu dung `/c/${username}` voi fallback `userId`
- Khong tao route `/:username` de tranh xung dot
- Khong can thay doi database
