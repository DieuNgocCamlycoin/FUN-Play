

# Toi uu hoa validation mo ta video toan he thong

## Tong quan

Them validation mo ta video day du (tuong tu tieu de) va dong bo tren tat ca 6 file: Web Upload, Mobile Upload, Mobile Description Editor, Edit Video Modal, Edit Video Page, va file validation trung tam.

## Thay doi chi tiet

### 1. `src/lib/videoUploadValidation.ts` - Them validation mo ta

Them ham `validateVideoDescription()` moi, tuong tu `validateVideoTitle()`:
- **Do dai**: 50 - 500 ky tu
- **Spam**: Chan 3+ ky tu lap lien tiep (giong title)
- **Noi dung co nghia**: Phai chua it nhat mot chu cai (Latin hoac Vietnamese Unicode), khong duoc chi la ky tu dac biet/emoji
- **Goi y hashtag**: Neu khong co '#', tra ve hint rieng (khong phai loi)
- Them hang so `MAX_DESCRIPTION_LENGTH = 500`
- Them ham `getHashtagHint()` tra ve "Them hashtag de video cua ban de tim hon!"
- Cap nhat `isDescriptionValid()` de dung `validateVideoDescription()` thay vi chi check do dai
- Them placeholder text lam hang so: `DESCRIPTION_PLACEHOLDER`

### 2. `src/components/Upload/UploadMetadataForm.tsx` - Web Upload

- Thay `maxLength={5000}` thanh `maxLength={500}`
- Thay `onChange` de `.slice(0, 500)`
- Thay placeholder moi: "Hay chia se cam hung cua ban ve video nay (toi thieu 50 ky tu)..."
- Thay counter `X/5000` thanh `X/500`
- Them hien thi loi tu `validateVideoDescription()` (spam, chi ky tu dac biet)
- Them hien thi hashtag hint khi khong co '#'
- Cap nhat `isValid` de bao gom `descriptionValidation.ok`

### 3. `src/components/Upload/Mobile/SubPages/DescriptionEditor.tsx` - Mobile Editor

- Thay `maxLength={5000}` thanh `maxLength={500}`
- Thay placeholder moi
- Thay counter `X/5000` thanh `X/500`
- Them hien thi loi validation (spam, ky tu dac biet)
- Them hashtag hint

### 4. `src/components/Upload/Mobile/VideoDetailsForm.tsx` - Mobile Details

- Cap nhat `descriptionOk` de dung `validateVideoDescription()` moi
- Cap nhat thong bao canh bao cho phu hop

### 5. `src/components/Studio/EditVideoModal.tsx` - Studio Edit

- Them validation mo ta: `maxLength={500}`, `.slice(0, 500)`
- Thay placeholder moi
- Them counter `X/500`
- Them hien thi loi validation va hashtag hint
- Cap nhat nut "Luu thay doi" de disable khi mo ta khong hop le

### 6. `src/pages/EditVideo.tsx` - Edit Page

- Them validation mo ta: `maxLength={500}`, `.slice(0, 500)`
- Thay placeholder moi
- Them counter `X/500`
- Them hien thi loi validation va hashtag hint
- Cap nhat nut "Luu thay doi" de disable khi mo ta khong hop le

## Tom tat file thay doi

| File | Hanh dong |
|------|-----------|
| `videoUploadValidation.ts` | Them `validateVideoDescription()`, `MAX_DESCRIPTION_LENGTH`, `DESCRIPTION_PLACEHOLDER`, `getHashtagHint()` |
| `UploadMetadataForm.tsx` | Max 500, placeholder moi, validation errors, hashtag hint, cap nhat isValid |
| `DescriptionEditor.tsx` | Max 500, placeholder moi, validation errors, hashtag hint |
| `VideoDetailsForm.tsx` | Dung validation moi cho descriptionOk |
| `EditVideoModal.tsx` | Max 500, placeholder, counter, validation, hashtag hint |
| `EditVideo.tsx` | Max 500, placeholder, counter, validation, hashtag hint |

## Nguyen tac

- Tat ca validation chay client-side (khong ton cloud)
- Logic tap trung trong `videoUploadValidation.ts`, cac file UI chi goi ham
- Thong nhat trai nghiem Web va Mobile

