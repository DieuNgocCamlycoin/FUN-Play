

## Sua loi false positive trong bo loc ten - Chuyen tu substring sang word boundary

### Van de

Ham `isNameAppropriate()` tai dong 45 dung `normalized.includes(normalizedWord)` de kiem tra tu cam. Cach nay match SUBSTRING, gay chan sai cac ten Viet Nam pho bien:

- "anhnguyet" chua "ngu" -> BI CHAN SAI
- "nguyenvana" chua "ngu" -> BI CHAN SAI  
- "kieuloan" chua "lon" -> BI CHAN SAI
- "chocolate" chua "cho" -> BI CHAN SAI

### Giai phap

Thay `includes()` bang regex word boundary tai dong 43-50 trong `src/lib/nameFilter.ts`.

### Chi tiet thay doi - 1 file duy nhat

**File: `src/lib/nameFilter.ts` - Ham `isNameAppropriate()`, dong 43-50**

```typescript
// TRUOC (dong 43-50):
for (const word of OFFENSIVE_WORDS) {
  const normalizedWord = removeDiacritics(word.toLowerCase());
  if (normalized.includes(normalizedWord)) {
    return {
      ok: false,
      reason: `Tên chứa từ ngữ không phù hợp. Vui lòng chọn tên khác.`,
    };
  }
}

// SAU:
for (const word of OFFENSIVE_WORDS) {
  const normalizedWord = removeDiacritics(word.toLowerCase());
  // Escape ky tu dac biet trong regex
  const escaped = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word boundary: chi match khi tu cam dung doc lap
  // (^|[^a-z]) = dau chuoi hoac ky tu khong phai chu cai
  // ([^a-z]|$) = cuoi chuoi hoac ky tu khong phai chu cai
  const regex = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
  if (regex.test(normalized)) {
    return {
      ok: false,
      reason: `Tên chứa từ ngữ không phù hợp. Vui lòng chọn tên khác.`,
    };
  }
}
```

### Giai thich logic

1. `removeDiacritics()` da duoc goi TRUOC regex (dong 41) nen "ngủ", "ngu", "NGU" deu thanh "ngu" truoc khi kiem tra
2. Co `i` trong regex dam bao case-insensitive (du da lowercase o dong 41, day la lop bao ve them)
3. `[^a-z]` la word boundary tu nhien - chi match khi tu cam duoc bao quanh boi ky tu khong phai chu cai (khoang trang, so, gach duoi, dau chuoi, cuoi chuoi)

### Ket qua kiem tra

| Input | Tu cam | Truoc | Sau | Dung? |
|-------|--------|-------|-----|-------|
| anhnguyet | ngu | CHAN | PASS | Dung - ten Viet Nam |
| Anh Nguyet | ngu | CHAN | PASS | Dung - ten Viet Nam |
| nguyenvana | ngu | CHAN | PASS | Dung - ten Viet Nam |
| Nguyen Van A | ngu | CHAN | PASS | Dung - ten Viet Nam |
| kieuloan | lon | CHAN | PASS | Dung - ten Viet Nam |
| Kieu Loan | lon | CHAN | PASS | Dung - ten Viet Nam |
| chocolate | cho | CHAN | PASS | Dung - tu tieng Anh |
| thang ngu | ngu | CHAN | CHAN | Dung - tu cam co khoang trang |
| thang_ngu | ngu | CHAN | CHAN | Dung - gach duoi la boundary |
| ngu | ngu | CHAN | CHAN | Dung - tu cam dung mot minh |
| do ngu | ngu | CHAN | CHAN | Dung - tu cam sau khoang trang |
| fuck | fuck | CHAN | CHAN | Dung - tu cam tieng Anh |
| fuckboy | fuck | CHAN | CHAN | Dung - "boy" khong phai chu cai truoc "fuck" |

Luu y dac biet: "fuckboy" van bi chan vi "fuck" nam o DAU chuoi (`^` match), va "boy" khong anh huong vi regex chi kiem tra boundary TRUOC tu cam.

### Pham vi anh huong

Chi sua 1 ham `isNameAppropriate()` trong 1 file. Tat ca cac noi goi ham nay tu dong duoc sua:
- `validateDisplayName()` (cung file, dong 100)
- `validateUsernameFormat()` (cung file, dong 164)
- `ProfileSettings.tsx` - cap nhat ten hien thi
- `ProfileOnboardingModal.tsx` - onboarding username
- `videoUploadValidation.ts` - kiem tra tieu de video

### Danh sach file

| STT | File | Thao tac |
|-----|------|----------|
| 1 | `src/lib/nameFilter.ts` | SUA - dong 43-50, thay includes() bang regex word boundary |

