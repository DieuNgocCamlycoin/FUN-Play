

## Sua loi 404 Avatar va dong bo link User tren toan bo Admin

### Van de
Trong `RewardApprovalTab.tsx` (tab "Cho Duyet"), link Avatar dang la:
```
https://official-funplay.lovable.app/${user.username}
```
Thieu prefix `/c/` theo cau truc routing cua he thong (`/c/:username`), gay loi 404.

Ngoai ra, nhieu tab admin khac (Approved, UserReview, QuickDelete, BannedUsers, UserStats, AdminManagement, IPAbuse) hien thi Avatar nhung **khong co link** de mo trang ca nhan user.

### Giai phap

Tao 1 helper function dung chung, sau do ap dung cho **tat ca cac tab admin**.

#### 1. Tao helper function `getProfileUrl`

Dat trong file rieng (vi du `src/lib/adminUtils.ts`) hoac inline:

```typescript
function getProfileUrl(username?: string | null, userId?: string): string | null {
  const identifier = username || userId;
  if (!identifier) return null;
  return `https://official-funplay.lovable.app/c/${identifier}`;
}
```

#### 2. Sua `RewardApprovalTab.tsx`
- Sua link Avatar: Them `/c/` va fallback `user.id`
- Boc ten user (`display_name`) trong link tuong tu
- Neu khong co username va id, vo hieu hoa click + hien tooltip "Khong tim thay thong tin User"

#### 3. Them link Avatar cho cac tab khac (dong bo)

| File | Hien tai | Thay doi |
|------|----------|---------|
| `RewardApprovalTab.tsx` | Link sai (thieu `/c/`) | Sua URL + fallback |
| `ApprovedListTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `UserReviewTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `QuickDeleteTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `BannedUsersTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `UserStatsTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `AdminManagementTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `IPAbuseDetectionTab.tsx` | Avatar khong co link | Boc `<a>` voi `target="_blank"` |
| `VideosManagementTab.tsx` | Da co link dung | Kiem tra + them fallback userId |

#### 4. Xu ly loi du lieu
- Kiem tra `username` truoc, neu khong co thi dung `user.id`
- Neu ca 2 deu khong co: khong boc link, hien text "Khong tim thay"
- Tat ca link deu co `target="_blank"` va `rel="noopener noreferrer"`

#### 5. Mau code cho moi Avatar

```typescript
const profileUrl = getProfileUrl(user.username, user.id);

{profileUrl ? (
  <a href={profileUrl} target="_blank" rel="noopener noreferrer">
    <Avatar className="... cursor-pointer hover:ring-2 hover:ring-primary transition-all">
      <AvatarImage src={user.avatar_url || undefined} />
      <AvatarFallback>...</AvatarFallback>
    </Avatar>
  </a>
) : (
  <Avatar className="... opacity-50">
    <AvatarImage src={user.avatar_url || undefined} />
    <AvatarFallback>...</AvatarFallback>
  </Avatar>
)}
```

### Tac dong
- **8 file** duoc cap nhat de dong bo logic link user
- Tat ca Avatar trong Admin deu co the click de mo trang ca nhan user o tab moi
- Khong anh huong den cac chuc nang hien co (Approve, Reject, Ban, v.v.)
- Hoat dong dong nhat tren web va mobile

