

## Sửa bộ lọc từ ngữ: Bỏ cơ chế loại dấu (removeDiacritics)

### Vấn đề
Việc bỏ dấu tiếng Việt trước khi so khớp gây ra nhiều **dương tính giả** — ví dụ "dẫn" bị nhầm thành "đần", "dì" bị nhầm thành "đĩ", v.v.

### Giải pháp
So khớp trực tiếp trên chuỗi gốc (có dấu), không bỏ dấu nữa. Danh sách từ cấm đã bao gồm cả dạng có dấu và không dấu (ví dụ: "đĩ" và "di me", "đụ" và "du ma") nên vẫn chặn được các trường hợp cần thiết.

### Thay đổi kỹ thuật

**File: `src/lib/nameFilter.ts`**

Cập nhật hàm `isNameAppropriate` (dòng 36-56):
- Bỏ gọi `removeDiacritics` trên cả input lẫn từ cấm
- So khớp trực tiếp trên chuỗi gốc (lowercase)
- Mở rộng regex word boundary để hỗ trợ ký tự tiếng Việt có dấu

```typescript
export function isNameAppropriate(name: string): { ok: boolean; reason?: string } {
  if (!name || name.trim().length === 0) {
    return { ok: true };
  }

  const lower = name.toLowerCase().trim();

  for (const word of OFFENSIVE_WORDS) {
    const lowerWord = word.toLowerCase();
    const escaped = lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])${escaped}([^a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]|$)`, 'i');
    if (regex.test(lower)) {
      return {
        ok: false,
        reason: "Tên chứa từ ngữ không phù hợp. Vui lòng chọn tên khác.",
      };
    }
  }

  return { ok: true };
}
```

Hàm `removeDiacritics` vẫn giữ lại trong file (không xóa) phòng trường hợp cần dùng ở nơi khác, nhưng không còn được gọi trong `isNameAppropriate`.

### Kết quả

| Input | Trước (bỏ dấu) | Sau (giữ dấu) |
|-------|----------------|---------------|
| "dẫn thiên" | Bị chặn (nhầm "đần") | Cho phép |
| "dì hai" | Bị chặn (nhầm "đĩ") | Cho phép |
| "thằng đần" | Bị chặn | Vẫn bị chặn |
| "con đĩ" | Bị chặn | Vẫn bị chặn |
| "fuck you" | Bị chặn | Vẫn bị chặn |
| "dit me" | Bị chặn | Vẫn bị chặn (có trong danh sách) |

| Tệp | Thay đổi |
|------|---------|
| `src/lib/nameFilter.ts` | Bỏ `removeDiacritics` khỏi hàm `isNameAppropriate`, so khớp trực tiếp trên chuỗi gốc |

