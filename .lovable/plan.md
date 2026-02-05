

# Kế Hoạch Sửa Lỗi Real-time Top 10 Creators & Honorboard

## Vấn Đề Đã Xác Định

### 1. Database KHÔNG được cấu hình cho Realtime
Khi kiểm tra `pg_publication_tables`, kết quả trả về **RỖNG** - nghĩa là **KHÔNG CÓ** bảng nào được publish cho Supabase Realtime. Đây là nguyên nhân chính khiến mọi realtime subscription đều không hoạt động.

### 2. `useAdminStatistics` KHÔNG có Realtime Subscriptions
Hook này chỉ fetch dữ liệu **MỘT LẦN** khi component mount và không bao giờ cập nhật cho đến khi refresh trang.

```typescript
// Hiện tại - CHỈ FETCH MỘT LẦN
useEffect(() => {
  fetchAdminStats();
}, []);  // Empty dependency - không có realtime
```

### 3. `useHonobarStats` chỉ hiển thị TOP 1 Creator
Hook này chỉ tính và hiển thị **MỘT** top creator duy nhất thay vì danh sách 10 người. Và logic khác với Admin (đếm số video thay vì lượt xem).

### 4. Không có Sync giữa Admin và Honorboard
- **Admin**: Sắp xếp theo `totalViews` 
- **Honorboard**: Sắp xếp theo `videoCount` từ 1000 video gần nhất

---

## Giải Pháp

### Bước 1: Publish Tables cho Supabase Realtime

Cần tạo migration để enable realtime cho các bảng cần thiết:

```sql
-- Enable realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_transactions;
```

### Bước 2: Thêm Realtime Subscriptions cho `useAdminStatistics`

Cập nhật hook để có realtime listeners:

```typescript
// Thêm realtime subscriptions
useEffect(() => {
  fetchAdminStats();

  // Realtime channels
  const videosChannel = supabase
    .channel('admin-videos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, fetchAdminStats)
    .subscribe();

  const profilesChannel = supabase
    .channel('admin-profiles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAdminStats)
    .subscribe();

  // ... thêm các channel khác

  return () => {
    supabase.removeChannel(videosChannel);
    supabase.removeChannel(profilesChannel);
    // cleanup...
  };
}, []);
```

### Bước 3: Mở Rộng `useHonobarStats` để Hỗ Trợ Top 10 Creators

Thêm state và logic để fetch danh sách Top 10:

```typescript
interface HonobarStats {
  // ... existing fields
  topCreator: {...} | null;
  topCreators: TopCreator[];  // NEW: Danh sách đầy đủ Top 10
}

// Fetch top 10 creators với logic giống Admin (theo views)
const { data: topCreatorData } = await supabase
  .from("videos")
  .select("user_id, view_count, profiles!inner(display_name, avatar_url)")
  .eq("approval_status", "approved");

// Aggregate và sort theo totalViews
const creatorMap = new Map();
topCreatorData?.forEach(video => {
  const existing = creatorMap.get(video.user_id) || {...};
  creatorMap.set(video.user_id, {
    ...existing,
    videoCount: existing.videoCount + 1,
    totalViews: existing.totalViews + (video.view_count || 0),
  });
});

const sortedCreators = Array.from(creatorMap.values())
  .sort((a, b) => b.totalViews - a.totalViews)
  .slice(0, 10);
```

### Bước 4: Cập Nhật UI Components

**Desktop Honobar (`EnhancedHonobar.tsx`):**
- Giữ nguyên hiển thị compact với Top 1

**Mobile Honobar (`MobileHonobar.tsx`):**
- Giữ nguyên hiển thị compact với Top 1

**Honobar Detail Modal (`HonobarDetailModal.tsx`):**
- Thêm section hiển thị Top 10 Creators đầy đủ khi mở popup

**Admin Overview (`OverviewTab.tsx`):**
- Thêm indicator realtime connection status
- Tự động cập nhật khi dữ liệu thay đổi

---

## Files Cần Thay Đổi

| File | Thay Đổi |
|------|----------|
| `supabase/migrations/` | Tạo migration mới để publish tables cho realtime |
| `src/hooks/useAdminStatistics.tsx` | Thêm Supabase realtime subscriptions |
| `src/hooks/useHonobarStats.tsx` | Thêm topCreators array, thống nhất logic với Admin |
| `src/components/Layout/HonobarDetailModal.tsx` | Hiển thị Top 10 Creators trong popup |
| `src/components/Admin/tabs/OverviewTab.tsx` | Thêm realtime connection indicator |

---

## Chi Tiết Kỹ Thuật

### Migration SQL

```sql
-- 001_enable_realtime_tables.sql

-- Enable realtime for tables used in Admin and Honorboard
DO $$
BEGIN
  -- Only add if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  -- Repeat for other tables...
END $$;
```

### Debounce cho Realtime Updates

Để tránh quá nhiều re-fetch khi có nhiều thay đổi liên tục:

```typescript
import { useCallback, useRef } from "react";

const fetchAdminStats = useCallback(() => {
  // Clear any pending timeout
  if (debounceRef.current) clearTimeout(debounceRef.current);
  
  debounceRef.current = setTimeout(async () => {
    // Actual fetch logic here
  }, 300); // 300ms debounce
}, []);
```

### Connection Status Indicator

```typescript
const [isConnected, setIsConnected] = useState(false);

channel.subscribe((status) => {
  setIsConnected(status === 'SUBSCRIBED');
});
```

---

## Kết Quả Mong Đợi

1. **Admin Panel**: Top 10 Creators và Top 10 Earners tự động cập nhật realtime khi có video mới, views mới, hoặc rewards mới
2. **Honorboard Desktop/Mobile**: Stats cập nhật realtime (đã có subscriptions, chỉ cần publish tables)
3. **Honorboard Popup**: Hiển thị danh sách Top 10 Creators đầy đủ với avatar, tên, số video, views
4. **Đồng bộ Logic**: Cả Admin và Honorboard sử dụng cùng tiêu chí xếp hạng (theo totalViews)

---

## Thứ Tự Triển Khai

1. **Database Migration** (bắt buộc làm trước) - Không có bước này thì realtime sẽ không hoạt động
2. **Update useHonobarStats** - Thêm topCreators array và thống nhất logic
3. **Update useAdminStatistics** - Thêm realtime subscriptions
4. **Update UI Components** - HonobarDetailModal, OverviewTab

