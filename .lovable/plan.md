

# Sửa Hệ Thống Thưởng Upload & Phân Loại Shorts

## Nguyên nhân gốc

**442 trên 675 video (65%) có duration = NULL trong database.** Đây là nguyên nhân gốc của cả hai vấn đề:

1. **Video dai > 3 phut khong duoc thuong 70K**: Khi duration = NULL, he thong mac dinh coi la SHORT (20K) thay vi LONG (70K).
2. **Video ngan khong hien trong tab Shorts**: Tab Shorts loc `duration <= 180`, nhung NULL khong khop voi dieu kien nay nen video khong hien.

### Tai sao duration = NULL?

Client-side duration extraction (dung HTML5 `<video>` element) that bai do:
- Timeout 10 giay khi video lon hoac format kho doc metadata
- Tren mobile, browser khong ho tro tot viec doc metadata tu mot so codec
- Desktop Upload.tsx luu `null` khi extraction that bai (dong 470: `duration: videoDuration > 0 ? Math.round(videoDuration) : null`)

## Giai phap (3 buoc)

### Buoc 1: Tu dong phat hien duration khi xem video (Watch page)

Khi nguoi dung xem video va player tai metadata thanh cong, tu dong cap nhat duration vao database neu hien tai la NULL. Day la cach tu nhien nhat de backfill duration -- moi video duoc xem se tu dong co duration.

**Tep**: `src/pages/Watch.tsx`
- Them logic: khi `onLoadedMetadata` cua video player, kiem tra neu video trong DB co `duration = NULL`, thi goi `supabase.from('videos').update({ duration }).eq('id', videoId)`

### Buoc 2: Sua mobile upload luu duration = NULL thay vi 0

**Tep**: `src/contexts/UploadContext.tsx` (dong 260)

Truoc:
```tsx
duration: Math.round(metadata.duration),
```

Sau:
```tsx
duration: metadata.duration > 0 ? Math.round(metadata.duration) : null,
```

Dieu nay dam bao video co duration khong ro se duoc danh dau NULL thay vi 0, de he thong biet can phat hien lai.

### Buoc 3: Edge function backfill thuong dung cho tat ca user

Tao edge function `recalculate-upload-rewards` de:
1. Tim tat ca video co `upload_rewarded = true` nhung `duration IS NOT NULL`
2. Kiem tra reward_transaction tuong ung co dung loai (SHORT vs LONG) khong
3. Neu sai (vi du: video 5 phut nhung duoc thuong SHORT 20K thay vi LONG 70K), thi:
   - Tinh chenh lech: 70K - 20K = 50K
   - Goi `atomic_increment_reward` de cong them 50K
   - Cap nhat reward_transaction tu SHORT_VIDEO_UPLOAD thanh LONG_VIDEO_UPLOAD va so tien moi

**Tep**: `supabase/functions/recalculate-upload-rewards/index.ts`

## Chi tiet ky thuat

| Tep | Thay doi |
|------|----------|
| `src/pages/Watch.tsx` | Them auto-detect duration khi video load, cap nhat DB neu NULL |
| `src/contexts/UploadContext.tsx` | Luu NULL thay vi 0 khi duration extraction that bai |
| `supabase/functions/recalculate-upload-rewards/index.ts` | Edge function moi de sua thuong cho tat ca user |

### Logic recalculate-upload-rewards

```
1. Admin-only (kiem tra user_roles)
2. Tham so: { dryRun: boolean, batchSize: number }
3. Query tat ca reward_transactions co reward_type IN ('SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD')
4. JOIN voi videos de lay duration thuc te
5. Voi moi transaction:
   - Neu video.duration > 180 VA reward_type = 'SHORT_VIDEO_UPLOAD':
     → Chenh lech = LONG_REWARD - SHORT_REWARD (70K - 20K = 50K)
     → atomic_increment_reward(user_id, 50K, true)
     → Update reward_transaction: reward_type = 'LONG_VIDEO_UPLOAD', amount = 70K
   - Neu video.duration <= 180 VA reward_type = 'LONG_VIDEO_UPLOAD':
     → Giam chenh lech (hiem gap, nhung xu ly cho day du)
6. Tra ve bao cao: so luong da sua, tong CAMLY chenh lech
```

### Auto-detect duration logic (Watch page)

```
1. Khi EnhancedVideoPlayer/MobileVideoPlayer goi onLoadedMetadata
2. Kiem tra video hien tai co duration = NULL trong DB khong
3. Neu NULL va player.duration > 0:
   → supabase.from('videos').update({ duration: Math.round(player.duration) }).eq('id', videoId)
   → Console.log de theo doi
4. Khong can cap nhat UI -- chi la background fix
```

