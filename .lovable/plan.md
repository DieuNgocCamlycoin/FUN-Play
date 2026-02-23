

## Đồng bộ tên kênh với tên hiển thị

### Nguyên nhân gốc

User `lanh237` có:
- `profiles.display_name` = "Nguyên Lành" (đã cập nhật)
- `channels.name` = "truonggiang141970's Channel" (tên cũ, tự động tạo khi đăng ký)

Header profile dùng `profiles.display_name`, còn video cards dùng `channels.name` --> hiển thị khác nhau.

### Giải pháp

Tạo một database trigger tự động đồng bộ `channels.name` mỗi khi `profiles.display_name` được cập nhật, đảm bảo hai giá trị luôn nhất quán.

### Các thay đổi

**1. Database migration - Tạo trigger đồng bộ**

Tạo function + trigger: khi `profiles.display_name` thay đổi, tự động cập nhật `channels.name` tương ứng.

```sql
CREATE OR REPLACE FUNCTION sync_channel_name_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name AND NEW.display_name IS NOT NULL THEN
    UPDATE channels
    SET name = NEW.display_name
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_channel_name
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_channel_name_on_profile_update();
```

**2. Database migration - Sửa dữ liệu hiện tại**

Đồng bộ tất cả channels hiện có mà tên kênh vẫn còn là dạng auto-generated (`%'s Channel`):

```sql
UPDATE channels c
SET name = p.display_name
FROM profiles p
WHERE c.user_id = p.id
  AND p.display_name IS NOT NULL
  AND c.name LIKE '%''s Channel';
```

**3. Frontend - Video cards ưu tiên display_name (dự phòng)**

Trong các file hiển thị video (`Index.tsx`, `ProfileVideosTab.tsx`, `Search.tsx`, `LikedVideos.tsx`), thay đổi logic channel name để fallback sang `profiles.display_name` khi `channels.name` vẫn là dạng cũ:

```typescript
// Trước:
channel={video.channels?.name || "Kênh chưa xác định"}

// Sau:  
channel={video.channels?.name || video.profiles?.display_name || "Kênh chưa xác định"}
```

Điều này đảm bảo ngay cả khi trigger chưa chạy hoặc dữ liệu cũ chưa được migration, video cards vẫn hiển thị đúng tên.

### Kết quả mong đợi

- Tên kênh và tên profile luôn đồng bộ tự động khi user đổi tên
- Dữ liệu cũ (dạng "xxx's Channel") được sửa hàng loạt
- Video cards có fallback an toàn sang display_name
