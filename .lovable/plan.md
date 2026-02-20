

## Sua loi ShareModal trong Watch.tsx

### Van de

Khi nguoi dung nhan "Chia se" tren trang xem video, link duoc tao ra van dung format cu `/watch/[UUID]` thay vi link sach `/:username/video/:slug`. Nguyen nhan: ShareModal khong duoc truyen `username` va `slug`.

### Giai phap - Chi sua 1 file: `Watch.tsx`

#### Thay doi 1: Mo rong query profiles de lay them `username`

Tai dong 243-247, query hien tai chi lay `avatar_url`. Them `username` vao cung lenh select:

```
// Truoc:
.select("avatar_url")

// Sau:
.select("avatar_url, username")
```

Luu `username` vao state moi `channelUsername`.

#### Thay doi 2: Them state `channelUsername`

Them 1 dong state moi gan dong 74:
```
const [channelUsername, setChannelUsername] = useState<string | null>(null);
```

#### Thay doi 3: Luu username trong fetchVideo

Tai dong 248-250, them logic luu username:
```
if (profileData?.avatar_url) setChannelAvatarUrl(profileData.avatar_url);
if (profileData?.username) setChannelUsername(profileData.username);
```

#### Thay doi 4: Truyen username + slug vao ShareModal (2 cho)

**Mobile** (dong 607-615):
```
<ShareModal
  ...
  username={channelUsername || undefined}
  slug={video?.slug || undefined}
/>
```

**Desktop** (dong 925-934):
```
<ShareModal
  ...
  username={channelUsername || undefined}
  slug={video?.slug || undefined}
/>
```

### Ket qua

- **0 request DB bo sung** - username duoc lay cung luc voi avatar_url trong 1 query duy nhat
- Link chia se se luon la: `play.fun.rich/[username]/video/[slug]`
- Fallback van hoat dong neu thieu du lieu (ShareModal tu dong dung `/watch/[id]` + legacy redirect xu ly)

### Tong ket

| Hang muc | Chi tiet |
|----------|---------|
| File thay doi | 1 file: `Watch.tsx` |
| Dong thay doi | ~8 dong |
| DB request them | 0 (gop vao query co san) |
| Risk | Rat thap - chi them props, khong thay doi logic |

