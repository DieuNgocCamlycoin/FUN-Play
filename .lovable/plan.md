

# Sửa Lỗi UserActivityStats & Kiểm Tra Mobile

## Vấn đề phát hiện

Component `UserActivityStats.tsx` có **bug nghiêm trọng**: xử lý dữ liệu từ RPC `get_user_activity_summary` sai cấu trúc.

- **RPC trả về**: một object JSONB duy nhất `{views, likes, comments, shares, uploads, total_camly, approved_camly, pending_camly}`
- **Code hiện tại**: kiểm tra `Array.isArray(summary)` rồi lặp qua `summary.forEach(row => ...)` -- luôn trả về false, nên thống kê luôn hiển thị **0** cho mọi giá trị

## Kế hoạch sửa lỗi

### Tệp: `src/components/Transactions/UserActivityStats.tsx`

Sửa hàm `fetchStats` để đọc đúng cấu trúc JSONB:

```typescript
// TRƯỚC (sai):
if (summary && Array.isArray(summary)) {
  summary.forEach((row: any) => { ... });
}

// SAU (đúng):
if (summary && typeof summary === 'object') {
  setData({
    views: Number(summary.views) || 0,
    likes: Number(summary.likes) || 0,
    comments: Number(summary.comments) || 0,
    shares: Number(summary.shares) || 0,
    uploads: Number(summary.uploads) || 0,
    totalCamly: Number(summary.total_camly) || 0,
  });
}
```

### Tệp cần thay đổi

| Tệp | Nội dung |
|------|----------|
| `src/components/Transactions/UserActivityStats.tsx` | Sửa parsing RPC response từ array sang object |

Tất cả các thay đổi khác (Mobile Drawer link, responsive layout, route) đã được triển khai đúng từ lần trước. Chỉ cần sửa bug parsing dữ liệu này.

