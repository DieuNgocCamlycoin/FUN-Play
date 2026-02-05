

# Kế Hoạch Sửa Lỗi và Cải Thiện Honor Board

## Tổng Quan Kiểm Tra

Sau khi kiểm tra kỹ lưỡng cả desktop và mobile, tôi xác nhận:

### Các Tính Năng Đang Hoạt Động Tốt

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Honor Board Card (Mobile) | ✅ Hoạt động | Hiển thị 166 users, 359 videos, 4.5K views, 5.8M CAMLY |
| Top Ranking Card (Mobile) | ✅ Hoạt động | Hiển thị Top 3 với badges 🥇🥈🥉 và CAMLY values |
| Honor Board Detail Modal | ✅ Hoạt động | Mở lên từ mobile với full Aurora styling |
| Video Grid 3 Columns | ✅ Hoạt động | Videos hiển thị đúng layout |
| Navigate to Leaderboard | ✅ Hoạt động | Click Top Ranking → /leaderboard |
| Aurora Theme | ✅ Hoạt động | Colors nhất quán |

### Lỗi Cần Sửa

| # | Vấn đề | Mức độ | File |
|---|--------|--------|------|
| 1 | Database Error 400: `profiles!inner` join fails | Trung bình | `useHonobarStats.tsx` |
| 2 | Top Creators code vẫn còn trong hook (không cần thiết) | Nhẹ | `useHonobarStats.tsx` |

---

## 1. Sửa Database Error 400

### Vấn đề

Query hiện tại đang cố sử dụng:
```tsx
supabase.from("videos")
  .select("user_id, view_count, profiles!inner(display_name, username, avatar_url)")
```

Lỗi: `Could not find a relationship between 'videos' and 'profiles' in the schema cache`

**Nguyên nhân**: Không có foreign key relationship giữa `videos.user_id` và `profiles.id` trong database.

### Giải pháp

Thay đổi cách fetch data - sử dụng 2 queries riêng biệt thay vì join:

```tsx
// Bước 1: Fetch videos
const { data: videosData } = await supabase
  .from("videos")
  .select("user_id, view_count")
  .eq("approval_status", "approved");

// Bước 2: Fetch profiles cho các user_ids
const userIds = [...new Set(videosData?.map(v => v.user_id))];
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, display_name, username, avatar_url")
  .in("id", userIds);

// Bước 3: Map profiles to videos
```

---

## 2. Xóa Code Top Creators (Không Cần Thiết)

### Vấn đề

Hook `useHonobarStats` vẫn chứa code cho `topCreator` và `topCreators`, nhưng chúng ta đã xóa Top Creators section khỏi UI.

### Giải pháp

Xóa các phần không cần thiết trong hook:
- Interface `TopCreator`
- State `topCreator` và `topCreators`
- Code build top creators list (lines 84-124)
- Return values `topCreator` và `topCreators`

Điều này cũng sẽ loại bỏ query lỗi 400.

---

## 3. Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/hooks/useHonobarStats.tsx` | Xóa topCreator/topCreators logic, sửa lỗi 400 |

---

## 4. Thay Đổi Chi Tiết

### useHonobarStats.tsx

**Xóa interface TopCreator (lines 4-10):**
```tsx
// XÓA HOÀN TOÀN
export interface TopCreator {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalViews: number;
}
```

**Cập nhật HonobarStats interface:**
```tsx
export interface HonobarStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewards: number;
  totalSubscriptions: number;
  camlyPool: number;
  // XÓA: topCreator và topCreators
}
```

**Cập nhật initial state:**
```tsx
const [stats, setStats] = useState<HonobarStats>({
  totalUsers: 0,
  totalVideos: 0,
  totalViews: 0,
  totalComments: 0,
  totalRewards: 0,
  totalSubscriptions: 0,
  camlyPool: 0,
  // XÓA: topCreator: null, topCreators: []
});
```

**Xóa query topCreatorData (line 68-71):**
```tsx
// XÓA query này hoàn toàn
supabase.from("videos")
  .select("user_id, view_count, profiles!inner(display_name, username, avatar_url)")
  .eq("approval_status", "approved")
  .limit(1000),
```

**Xóa code build topCreators (lines 84-124):**
Xóa toàn bộ block xử lý topCreatorData.

**Cập nhật setStats:**
```tsx
setStats({
  totalUsers: usersCount || 0,
  totalVideos: videosCount || 0,
  totalViews,
  totalComments: commentsCount || 0,
  totalRewards,
  totalSubscriptions: subscriptionsCount || 0,
  camlyPool,
  // XÓA: topCreator, topCreators
});
```

---

## 5. Kiểm Tra Lại Sau Sửa

| Test case | Expected |
|-----------|----------|
| Homepage load | Không còn error 400 |
| Honor Board stats | Hiển thị đúng |
| Mobile view | Cards hoạt động bình thường |
| Console logs | Không có errors |

---

## 6. Kết Quả Mong Đợi

| Metric | Trước | Sau |
|--------|-------|-----|
| Network errors | 1 (400 status) | 0 |
| Console errors | Có warning | Clean |
| Features working | 95% | 100% |
| Code cleanliness | Có dead code | Sạch |

