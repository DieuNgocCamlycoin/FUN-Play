

## Cập nhật batch-fetch để re-fetch TẤT CẢ avatar mạng xã hội

### Vấn đề hiện tại
Function `batch-fetch-social-avatars` chỉ fetch avatar cho platform **chưa có** avatar (dòng 49: `if (url && !existingAvatars[key])`). Nghĩa là nếu avatar cũ đã lưu (dù sai hoặc lỗi), hệ thống sẽ bỏ qua và không cập nhật lại.

### Giải pháp
Thêm param `forceRefresh` vào `batch-fetch-social-avatars`. Khi `forceRefresh = true`, function sẽ gửi **tất cả** platform có URL (Facebook, YouTube, X/Twitter, Telegram, TikTok, LinkedIn, Zalo, FUN Profile, Angel AI) để re-fetch avatar mới, chỉ giữ nguyên avatar được user upload thủ công.

### File thay đổi

| File | Thay đổi |
|---|---|
| `supabase/functions/batch-fetch-social-avatars/index.ts` | Thêm `forceRefresh` param, khi `true` gửi tất cả platform có URL để re-fetch. Truyền `manualAvatars` để bảo vệ avatar thủ công |

### Chi tiết kỹ thuật

**Thay đổi chính trong `batch-fetch-social-avatars/index.ts`:**

1. Parse `forceRefresh` từ request body (default `false`)
2. Thay đổi logic lọc platform (dòng 46-52):
   - Khi `forceRefresh = false`: giữ logic cũ (chỉ fetch platform chưa có avatar)
   - Khi `forceRefresh = true`: gửi tất cả platform có URL, bất kể đã có avatar hay chưa
3. Xác định danh sách manual avatars: avatar nào chứa URL từ R2 storage (ví dụ chứa `r2.dev` hoặc `social-avatars/`) sẽ được coi là upload thủ công, truyền vào `manualAvatars` để `fetch-social-avatar` không ghi đè
4. Tăng limit từ 500 lên 1000 để cover nhiều user hơn

```typescript
// Parse forceRefresh
const body = await req.json().catch(() => ({}));
const forceRefresh = body?.forceRefresh === true;

// Trong vòng lặp:
const platformsToFetch: Record<string, string> = {};
const manualAvatarKeys: string[] = [];

for (const { key, field } of socialFields) {
  const url = (profile as any)[field];
  if (!url) continue;
  
  const existingAvatar = existingAvatars[key];
  // Detect manual uploads (R2 storage URLs)
  const isManual = existingAvatar && (
    existingAvatar.includes("social-avatars/") || 
    existingAvatar.includes("r2.dev")
  );
  
  if (isManual) {
    manualAvatarKeys.push(key);
    continue; // Luôn bảo vệ avatar thủ công
  }
  
  if (forceRefresh || !existingAvatar) {
    platformsToFetch[key] = url;
  }
}
```

### Sau khi deploy
Sẽ gọi function với `{ "forceRefresh": true }` để cập nhật avatar cho tất cả mạng xã hội (Facebook, YouTube, X/Twitter, Telegram, TikTok, LinkedIn, Zalo, FUN Profile, Angel AI) trên toàn bộ user.

