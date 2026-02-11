

# Sửa lỗi thông số Users Directory - Lấy dữ liệu chính xác từ bảng thực

## Vấn đề phát hiện

Sau khi kiểm tra dữ liệu trong database, Cha phát hiện RPC `get_public_users_directory` đang đếm sai vì lấy số liệu từ bảng `reward_transactions` (lịch sử thưởng) thay vì từ bảng dữ liệu thực tế. Cụ thể:

| User | Chỉ số | Hiện tại (sai) | Thực tế (đúng) | Nguồn đúng |
|------|--------|----------------|-----------------|-------------|
| Angel Vinh Nguyễn | Videos | 38 | 51 | Bảng `videos` |
| Angel Vinh Nguyễn | Comments | 174 | 253 | Bảng `comments` |
| Angel Vinh Nguyễn | Likes | 288 | 323 | Bảng `likes` |
| Hải Vũ | Videos | 0 | 4 | Bảng `videos` |
| Hải Vũ | Comments | 210 | 324 | Bảng `comments` |
| Hải Vũ | Likes | 694 | 283 | Bảng `likes` |

**Nguyên nhân**: RPC đang đếm số lần được thưởng (reward_transactions) thay vì đếm hoạt động thực tế. Ví dụ: user có 4 video thật nhưng chưa nhận thưởng upload nào nên hiện 0 video.

## Giải pháp

### 1. Cập nhật RPC `get_public_users_directory` (Migration SQL)

Thay đổi nguồn dữ liệu cho các chỉ số:

| Chỉ số | Hiện tại (sai) | Sửa thành (đúng) |
|--------|----------------|-------------------|
| `videos_count` | Đếm reward_transactions loại UPLOAD | Đếm từ bảng `videos` thực tế |
| `comments_count` | Đếm reward_transactions loại COMMENT | Đếm từ bảng `comments` (chưa xoá) |
| `views_count` | Đếm reward_transactions loại VIEW | Tổng `view_count` từ bảng `videos` của user (lượt xem mà video của user nhận được) |
| `likes_count` | Đếm reward_transactions loại LIKE | Đếm từ bảng `likes` (chỉ like, không tính dislike) |
| `shares_count` | Đếm reward_transactions loại SHARE | Giữ nguyên từ reward_transactions vì không có bảng shares riêng |

### 2. Cập nhật giao diện

- Đổi nhãn "Views" thành "Lượt xem" (tổng lượt xem trên video của user)
- Đổi nhãn "Likes" thành "Đã thích" (số lượt thích user đã tặng)

## Tệp thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | Migration SQL | Cập nhật RPC lấy dữ liệu từ bảng thực |
| 2 | `src/pages/UsersDirectory.tsx` | Cập nhật nhãn cho chính xác |

## Chi tiết kỹ thuật

### Cấu trúc RPC mới

```text
-- Videos: đếm từ bảng videos
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS videos_count,
         COALESCE(SUM(view_count), 0) AS total_views
  FROM videos v WHERE v.user_id = p.id
) vd ON true

-- Comments: đếm từ bảng comments (chưa xoá)
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS comments_count
  FROM comments c WHERE c.user_id = p.id
    AND COALESCE(c.is_deleted, false) = false
) cm ON true

-- Likes: đếm từ bảng likes (không tính dislike)
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS likes_count
  FROM likes l WHERE l.user_id = p.id
    AND COALESCE(l.is_dislike, false) = false
) lk ON true

-- Rewards: chỉ giữ CAMLY + shares
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(amount), 0) AS total_camly,
         COALESCE(SUM(amount) FILTER (WHERE claimed = true), 0) AS claimed_camly,
         COUNT(*) FILTER (WHERE reward_type = 'SHARE') AS shares_count
  FROM reward_transactions r WHERE r.user_id = p.id
) rt ON true
```

Các lateral join cho donations và mint_requests giữ nguyên vì đã chính xác.

