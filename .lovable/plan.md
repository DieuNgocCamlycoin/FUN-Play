
## Điều chỉnh bộ lọc spam mô tả video

### Thay đổi

Sửa regex chặn ký tự lặp trong hàm `validateVideoDescription` (dòng 91) từ chặn **3+ ký tự lặp bất kỳ** sang chỉ chặn **15+ chữ cái lặp liên tiếp**, cho phép dấu ba chấm, emoji, dấu câu lặp bình thường.

### Chi tiết kỹ thuật

**File: `src/lib/videoUploadValidation.ts`**

Dòng 90-93: Thay regex `(.)\1{2,}` bằng regex chỉ bắt chữ cái lặp 15+ lần:

```
// Trước:
if (/(.)\1{2,}/i.test(trimmed))

// Sau:
if (/([a-zA-ZÀ-ỹ])\1{14,}/iu.test(trimmed))
```

Giải thích: `\1{14,}` nghĩa là ký tự đầu + 14 lần lặp = 15 lần tổng cộng. Chỉ áp dụng cho chữ cái (Latin + Vietnamese), bỏ qua dấu câu và emoji.

| File | Thay đổi |
|------|---------|
| `src/lib/videoUploadValidation.ts` | Dòng 91: đổi regex spam từ `(.)\1{2,}` sang `([a-zA-ZÀ-ỹ])\1{14,}` |
