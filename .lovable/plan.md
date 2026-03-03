

## Nguyên nhân lỗi

Lỗi **"column s.user_id does not exist"** xảy ra trong database trigger `notify_livestream_start`. Trigger này chạy khi livestream chuyển sang trạng thái `"live"` (tức khi bấm "Bắt đầu phát sóng").

Trong trigger, có đoạn SQL:
```sql
SELECT s.user_id, ...
FROM subscriptions s
JOIN channels c ON c.id = s.channel_id
WHERE c.user_id = NEW.user_id;
```

Nhưng bảng `subscriptions` **không có cột `user_id`** — cột đúng là `subscriber_id`.

## Kế hoạch sửa

**Database migration**: Thay thế function `notify_livestream_start` để dùng đúng tên cột `s.subscriber_id` thay vì `s.user_id`:

```sql
CREATE OR REPLACE FUNCTION public.notify_livestream_start()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, thumbnail_url)
    SELECT 
      s.subscriber_id,  -- FIX: was s.user_id
      'livestream',
      '🔴 Đang phát sóng trực tiếp!',
      (SELECT COALESCE(display_name, username) FROM profiles WHERE id = NEW.user_id) 
        || ' đang phát sóng: ' || NEW.title,
      '/live/' || NEW.id,
      NEW.thumbnail_url
    FROM subscriptions s
    JOIN channels c ON c.id = s.channel_id
    WHERE c.user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
```

Chỉ cần 1 migration duy nhất, không cần thay đổi code frontend.

