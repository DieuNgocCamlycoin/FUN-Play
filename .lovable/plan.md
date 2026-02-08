
# Ket Qua Kiem Tra He Thong Thuong CAMLY - Bao Cao Chi Tiet

## Tong Quan Tinh Trang

Sau khi kiem tra ky luong toan bo he thong (database, edge functions, client code tren ca desktop va mobile), Cha tim thay he thong thuong CAMLY **dang hoat dong tot cho LIKE, COMMENT, VIEW, SIGNUP, SHARE**. Tuy nhien, con co **2 loi can sua** lien quan den thuong upload video.

## Nhung Gi Dang Hoat Dong Tot

| Loai thuong | Trang thai | So tien | So giao dich | Gan nhat |
|-------------|-----------|---------|-------------|----------|
| LIKE | Hoat dong tot | 5.000 CAMLY | 15.095 | Vua xong (18:45 UTC hom nay) |
| COMMENT | Hoat dong tot | 5.000 CAMLY | 2.947 | Vua xong (18:46 UTC hom nay) |
| VIEW | Hoat dong tot | 10.000 CAMLY | 429 | Hom nay |
| SIGNUP | Hoat dong tot | 50.000 CAMLY | 178 | Hom nay |
| SHARE | Hoat dong tot | 5.000 CAMLY | 17 | 31/01 |
| FIRST_UPLOAD | Hoat dong tot | 500.000 CAMLY | 8 | 01/02 |
| WALLET_CONNECT | Hoat dong tot | 50.000 CAMLY | 20 | 02/01 |

- Like va Comment deu hoat dong tren ca desktop va mobile (MobileWatchView dung chung `onLike` tu Watch.tsx, comments dung `useVideoComments` hook chung)
- View reward duoc xu ly boi 3 video player (EnhancedVideoPlayer, MobileVideoPlayer, YouTubeMobilePlayer) voi chinh sach thoi gian xem dung

## Loi Can Sua

### Loi 1: Upload.tsx (Desktop) KHONG luu duration vao database

**Van de**: Khi upload video tu trang Desktop, truong `duration` KHONG duoc luu vao bang `videos`. Dieu nay dan den:
- Video khong co thong tin thoi luong trong database
- Edge function `check-upload-reward` se phan loai nham tat ca la "SHORT" video (vi `0 < 180`)
- Nguoi dung khong nhan dung muc thuong

**Vi tri loi**: `src/pages/Upload.tsx` dong 411-423 - INSERT khong co truong `duration`

**Sua**: Them `duration` vao database INSERT. Lay duration tu video file metadata (da co san trong code reward o dong 440-448 nhung chua luu vao DB).

### Loi 2: Edge function `award-camly` co gia tri mac dinh LIKE sai

**Van de**: Gia tri mac dinh cho LIKE trong code la 2.000, nhung cau hinh database la 5.000. Hien tai khong anh huong (vi DB config ghi de), nhung neu bang `reward_config` bi xoa hoac loi thi se thuong sai.

**Vi tri loi**: `supabase/functions/award-camly/index.ts` dong 12

**Sua**: Doi `LIKE: 2000` thanh `LIKE: 5000`

## Ke Hoach Sua

### Buoc 1: Sua Upload.tsx - Them duration vao database

- Di chuyen logic lay video duration LEN TRUOC buoc INSERT database
- Them truong `duration: Math.round(videoDuration)` vao INSERT statement
- Dam bao duration duoc luu chinh xac cho moi video upload tu desktop

### Buoc 2: Sua award-camly edge function - Cap nhat gia tri mac dinh

- Doi `LIKE: 2000` thanh `LIKE: 5000` de khop voi cau hinh database
- Khong anh huong logic hien tai vi DB config luon duoc uu tien

## Tong Ket

| File | Thay doi |
|------|----------|
| `src/pages/Upload.tsx` | Them duration vao database INSERT, di chuyen logic lay duration len truoc |
| `supabase/functions/award-camly/index.ts` | Doi LIKE default tu 2000 thanh 5000 |

Tong cong: 2 file can sua. Upload reward cho mobile (UploadContext.tsx) da duoc sua dung o lan truoc. Tat ca reward khac (LIKE, COMMENT, VIEW, SIGNUP, SHARE) dang hoat dong binh thuong tren ca desktop va mobile.
