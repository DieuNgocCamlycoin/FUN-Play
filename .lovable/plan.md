

# He thong xac thuc tieu de video thong minh

## Tong quan

Xay dung function `validateVideoTitle()` trong `videoUploadValidation.ts`, su dung lai cac pattern tu `nameFilter.ts`. Tich hop vao 4 file UI (web upload, mobile upload, edit modal, edit page) de validate real-time phia client.

## Chi tiet ky thuat

### 1. Tao function `validateVideoTitle` trong `src/lib/videoUploadValidation.ts`

Them function tra ve `{ ok: boolean; reason?: string }` voi cac kiem tra:

| Kiem tra | Chi tiet |
|----------|----------|
| Do dai toi thieu | >= 5 ky tu |
| Phai co chu cai | Regex cho chu Latin va chu Viet (Unicode) |
| Khong chi so | Block chuoi chi chua so |
| Khong ky tu lap 3+ | Regex `(.)\1{2,}` |
| Keyboard spam | qwerty, asdfgh, zxcvbn, qazwsx, abcdef |
| Tu ngu nhay cam | Goi `isNameAppropriate()` tu `nameFilter.ts` |

```text
export function validateVideoTitle(title: string): { ok: boolean; reason?: string }
```

### 2. Cap nhat `UploadMetadataForm.tsx` (Web upload)

- Goi `validateVideoTitle()` khi title thay doi
- Hien thi loi mau do duoi input title
- Them dong PPLP: "Mot tieu de dep la khoi dau cua phung su va anh sang"
- Cap nhat dieu kien `isValid` de ket hop ket qua validation

### 3. Cap nhat `VideoDetailsForm.tsx` (Mobile upload)

- Goi `validateVideoTitle()` khi title thay doi
- Hien thi loi mau do duoi input title (giong warning duration/description)
- Them dong PPLP
- Cap nhat `canUpload` de ket hop validation

### 4. Cap nhat `EditVideoModal.tsx` (Studio edit)

- Goi `validateVideoTitle()` khi title thay doi
- Hien thi loi mau do duoi input
- Them dong PPLP
- Disable nut "Luu thay doi" khi title khong hop le

### 5. Cap nhat `EditVideo.tsx` (Edit page)

- Goi `validateVideoTitle()` khi title thay doi
- Hien thi loi mau do duoi input
- Them dong PPLP
- Disable nut "Luu thay doi" khi title khong hop le

## Khong thay doi backend

Toan bo validation chay phia client. Khong goi Supabase khi title khong hop le.

## Vi du thong bao loi cu the

- "Tieu de phai co it nhat 5 ky tu"
- "Tieu de phai chua it nhat mot chu cai"
- "Tieu de khong duoc chi chua so"
- "Vui long khong su dung ky tu lap lai lien tiep"
- "Tieu de khong hop le"
- "Tieu de chua tu ngu khong phu hop..."

