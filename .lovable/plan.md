

## Giới hạn "Xu hướng" chỉ hiển thị video trong 5 ngày gần nhất

### Thay đổi

**File: `src/pages/Index.tsx`**

- **Dòng 315**: Thay `if (selectedCategory === "Xu hướng") return true;` thành lọc chỉ video trong 5 ngày gần nhất:

```typescript
if (selectedCategory === "Xu hướng") {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  return new Date(video.created_at) >= fiveDaysAgo;
}
```

- Hệ số thời gian trong `calculateTrendingScore` vẫn giữ nguyên để phân biệt video mới vài giờ vs mới vài ngày.

### Kết quả
- Thẻ "Xu hướng" chỉ hiển thị video đăng trong **5 ngày gần nhất**
- Video cũ hơn 5 ngày sẽ không xuất hiện trong danh sách xu hướng
- Thứ tự sắp xếp vẫn theo điểm trending score đã triển khai

| Tệp | Thay đổi |
|------|---------|
| `src/pages/Index.tsx` | Thêm bộ lọc 5 ngày cho category "Xu hướng" (dòng 315) |

