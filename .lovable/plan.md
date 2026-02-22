

## Thiết kế lại giao diện Mạng xã hội + Validation link theo nền tảng (đã chỉnh sửa)

### Tổng quan

Thay đổi giao diện mục "Liên kết mạng xã hội" theo mẫu tham khảo (dạng card + chip) và thêm validation URL theo từng nền tảng cụ thể.

### Quy tắc validation URL theo nền tảng (đã sửa)

| Nen tang     | URL phai bat dau bang                                  |
|-------------|--------------------------------------------------------|
| Fun Profile | `https://fun.rich/`                                    |
| FUN Play    | `https://play.fun.rich/`                               |
| Angel AI    | `https://angel.ai/`                                    |
| Facebook    | `https://www.facebook.com/` hoac `https://facebook.com/` |
| YouTube     | `https://www.youtube.com/` hoac `https://youtube.com/` |
| X / Twitter | `https://x.com/` hoac `https://twitter.com/`          |
| Telegram    | `https://t.me/`                                        |
| TikTok      | `https://www.tiktok.com/` hoac `https://tiktok.com/`  |
| LinkedIn    | `https://www.linkedin.com/` hoac `https://linkedin.com/` |
| Zalo        | `https://zalo.me/`                                     |

**Luu y:** Fun Profile chi chap nhan `https://fun.rich/...`, con `https://play.fun.rich/...` la link cua FUN Play (mot nen tang khac).

### Giao dien moi

**Phan 1 -- Link da them (card list):**
- Tieu de: "Mang xa hoi (n/9)"
- Moi link hien thi dang card: icon nen tang + ten (in dam) + URL (cat ngan) + nut X xoa
- Card co vien, bo goc, nen toi nhe

**Phan 2 -- Them mang xa hoi:**
- Cac nen tang chua co link hien thi dang chip (icon + ten, bo tron)
- Bam chip -> hien o input voi placeholder tuong ung + nut "+" de them
- Neu URL khong hop le (khong khop pattern cua nen tang): hien canh bao do, khong cho them
- Neu hop le: them thanh cong, chip bien mat, card xuat hien o phan 1

### Chi tiet ky thuat

**File: `src/pages/ProfileSettings.tsx`**

1. Mang `socialPlatforms` voi truong `patterns` cho moi nen tang:
   - Fun Profile: `["https://fun.rich/"]` (KHONG bao gom play.fun.rich)
   - FUN Play: `["https://play.fun.rich/"]`
   - Cac nen tang khac nhu bang tren

2. Them state moi: `selectedPlatform`, `tempUrl`, `urlError`

3. Ham validate: kiem tra `tempUrl` co bat dau bang it nhat 1 pattern trong `patterns` khong

4. Ham them link: neu hop le -> goi setter, reset state; neu khong -> set urlError voi thong bao cu the (vi du: "Link Facebook phai bat dau bang https://www.facebook.com/")

5. Icon mapping dung Lucide: Facebook, Youtube, Twitter, MessageCircle (Telegram), Music (TikTok), Linkedin, Phone (Zalo), Globe (Fun Profile), Bot (Angel AI), Gamepad2 (FUN Play)

6. Dau tick xanh CheckCircle2 hien thi tren card da them thanh cong

Chi thay doi 1 file: `src/pages/ProfileSettings.tsx`

