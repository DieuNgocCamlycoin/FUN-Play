
# Sua loi va don dep he thong validation tieu de video

## Van de phat hien

### Loi trong `UploadMetadataForm.tsx` (Web Upload)

1. **Dieu kien `isValid` sai**: Dong 119 kiem tra `length >= 3` trong khi `validateVideoTitle()` yeu cau `>= 5`. Dieu nay tao mau thuan — khi title co 3-4 ky tu, validation tra ve `ok: false` nhung dieu kien `length >= 3` van dung. Ket qua: nut "Tiep tuc" bi disable dung nhung ly do hien thi khong nhat quan.

2. **Thong bao loi thua/xung dot** (dong 153-155): Hien thi "Tieu de can it nhat 3 ky tu" — mau thuan voi thong bao chinh thuc "Tieu de phai co it nhat 5 ky tu" tu `validateVideoTitle()`. Nguoi dung thay 2 thong bao khac nhau ve do dai toi thieu.

### Cac file khac: Khong co loi

`EditVideo.tsx`, `EditVideoModal.tsx`, `VideoDetailsForm.tsx` — tat ca da dung `title.trim().length > 0 && titleValidation.ok` dung cach.

## Giai phap

### 1. Sua `UploadMetadataForm.tsx`

- Doi `isValid` tu `metadata.title.trim().length >= 3` thanh `metadata.title.trim().length > 0` de nhat quan voi cac file khac
- Xoa doan thong bao loi thua "Tieu de can it nhat 3 ky tu" (dong 153-155) vi `validateVideoTitle()` da xu ly viec nay

### Chi tiet thay doi

| File | Thay doi | Ly do |
|------|----------|-------|
| `UploadMetadataForm.tsx` dong 119 | `length >= 3` -> `length > 0` | Thong nhat voi cac file khac, uy quyen cho `validateVideoTitle()` |
| `UploadMetadataForm.tsx` dong 153-155 | Xoa 3 dong thong bao loi thua | Trung lap va xung dot voi validation chinh |

### Khong thay doi

- `videoUploadValidation.ts` — logic validation dung, khong can sua
- `EditVideo.tsx` — da dung
- `EditVideoModal.tsx` — da dung
- `VideoDetailsForm.tsx` — da dung
