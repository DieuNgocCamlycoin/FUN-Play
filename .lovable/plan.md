

# Kiểm Tra & Sửa Hệ Thống Thưởng và Phân Loại Shorts

## Kết quả kiểm tra

### 1. Thưởng video dai (70K) -- Hoat dong dung cho video moi
- Edge function `award-camly` da co logic xac minh duration phia server (dong 238-253)
- Khi video co duration > 180s, he thong tu dong chuyen tu SHORT (20K) thanh LONG (70K)
- **127 giao dich LONG_VIDEO_UPLOAD** da ghi nhan dung 70.000 CAMLY

### 2. Van de con lai: 442 video co duration = NULL
- 393 video NULL duration da bi thuong nham la SHORT (20K)
- Co che auto-detect duration khi xem video (Watch page) da duoc cai dat va hoat dong
- Edge function `recalculate-upload-rewards` da san sang nhung can cho duration duoc backfill truoc

### 3. Loi tab Shorts trong trang ca nhan channel
- **31 video** co `category='shorts'` nhung `duration = NULL`
- Bo loc hien tai: `query.lte("duration", 180)` -- NULL khong khop nen video khong hien
- Can sua bo loc de dung ca `category` lam tieu chi phu

## Giai phap

### Tep 1: `src/components/Profile/ProfileVideosTab.tsx`

Sua bo loc Shorts de bao gom ca video co `category='shorts'` khi duration la NULL:

**Truoc (dong 54-58):**
```tsx
if (type === "shorts") {
  query = query.lte("duration", 180);
} else {
  query = query.or("duration.gt.180,duration.is.null");
}
```

**Sau:**
```tsx
if (type === "shorts") {
  query = query.or("duration.lte.180,and(duration.is.null,category.eq.shorts)");
} else {
  query = query.or("duration.gt.180,and(duration.is.null,category.neq.shorts)");
}
```

### Tep 2: `src/pages/YourVideos.tsx`

Tuong tu, sua bo loc trong trang quan ly video cua nguoi dung:

**Truoc (dong 58-62):**
```tsx
if (activeTab === "video") {
  query = query.or("duration.gt.180,duration.is.null");
} else if (activeTab === "shorts") {
  query = query.lte("duration", 180);
}
```

**Sau:**
```tsx
if (activeTab === "video") {
  query = query.or("duration.gt.180,and(duration.is.null,category.neq.shorts)");
} else if (activeTab === "shorts") {
  query = query.or("duration.lte.180,and(duration.is.null,category.eq.shorts)");
}
```

### Tep 3: `src/contexts/UploadContext.tsx` -- Da dung

Da luu `null` thay vi `0` khi duration extraction that bai. Khong can thay doi them.

### Tep 4: `src/pages/Watch.tsx` -- Da dung

Auto-detect duration da hoat dong. Khong can thay doi them.

### Tep 5: `supabase/functions/recalculate-upload-rewards/index.ts` -- Da dung

Edge function da san sang. Admin goi voi `{"dryRun": false}` sau khi cac video da duoc backfill duration.

## Tom tat thay doi

| Tep | Thay doi |
|------|----------|
| `src/components/Profile/ProfileVideosTab.tsx` | Sua bo loc Shorts de dung `category` lam fallback khi duration = NULL |
| `src/pages/YourVideos.tsx` | Tuong tu -- sua bo loc Shorts/Video cho trang quan ly |

## Tong ket

- He thong thuong 70K cho video dai **da hoat dong dung** cho video moi co duration
- 442 video cu se duoc tu dong cap nhat duration khi co nguoi xem
- Sau khi duration duoc backfill, admin chay `recalculate-upload-rewards` de bu thuong
- Loi Shorts khong hien duoc sua bang cach dung `category` lam tieu chi phu khi `duration = NULL`
