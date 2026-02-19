

# Sua loi he thong kiem soat chat luong video

## Van de phat hien

### 1. Trang `/upload` cu (Upload.tsx) - KHONG CO BAT KY VALIDATION NAO
Trang `src/pages/Upload.tsx` (782 dong) la trang upload cu van con hoat dong tai route `/upload`. Trang nay **KHONG** co:
- Kiem tra thoi luong video (cho phep video 12s)
- Kiem tra ten file bi chan (cho phep snaptik, mixkit, v.v.)
- Kiem tra tieu de (validateVideoTitle)
- Kiem tra mo ta (min 50 ky tu)
- Kiem tra avatar (avatar gate)
- Kiem tra noi dung (content moderation)

Day la ly do video 12s va video tu snaptik van duoc dang thanh cong.

### 2. "snaptik" chua co trong danh sach chan
File `videoUploadValidation.ts` co `BLOCKED_FILENAME_PATTERNS` nhung thieu "snaptik" va "snaptick" - hai ten file phoi bien tu trang tai video TikTok.

### 3. UploadVideoModal.tsx - Code chet (888 dong)
File `src/components/Video/UploadVideoModal.tsx` khong duoc import o bat ky dau trong du an. Day la 888 dong code thua hoan toan.

## Giai phap

### Buoc 1: Xoa trang Upload.tsx cu va route cua no
- Xoa file `src/pages/Upload.tsx` (782 dong code thua)
- Xoa route `/upload` trong `App.tsx`
- Chuyen huong `/upload` ve trang chu (hoac mo UploadWizard)

### Buoc 2: Xoa UploadVideoModal.tsx (code chet)
- Xoa file `src/components/Video/UploadVideoModal.tsx` (888 dong code thua)

### Buoc 3: Them "snaptik"/"snaptick" vao BLOCKED_FILENAME_PATTERNS
Trong `src/lib/videoUploadValidation.ts`, them cac pattern:
- "snaptik"
- "snaptick"
- "ssstik" (mot trang tai TikTok khac)
- "tikdown"
- "musicaldown"

### Buoc 4: Cap nhat App.tsx
- Xoa lazy import cua Upload page
- Thay route `/upload` bang redirect ve trang chu

## Tong ket thay doi

| File | Hanh dong | Ly do |
|------|-----------|-------|
| `src/pages/Upload.tsx` | XOA | Trang upload cu khong co validation, la lo hong bao mat chinh |
| `src/components/Video/UploadVideoModal.tsx` | XOA | Code chet, khong duoc import o dau |
| `src/lib/videoUploadValidation.ts` | SUA | Them snaptik va cac pattern moi vao danh sach chan |
| `src/App.tsx` | SUA | Xoa route `/upload` cu, them redirect |

## Ket qua
- Tat ca nguoi dung chi co the upload qua UploadWizard (web) hoac MobileUploadFlow (mobile) - hai luong nay da co day du validation
- Video tu snaptik/snaptick bi chan ngay khi chon file
- Loai bo 1,670 dong code thua (782 + 888)
