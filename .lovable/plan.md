

## Triển khai toàn bộ tính năng Báo cáo Video + Channel

### 1. Database Migration

Tao bang `channel_reports`, them cot `detail` vao `video_reports`, them cot `report_count` vao `channels`, tao triggers thong bao admin.

```sql
-- Tao bang channel_reports
CREATE TABLE public.channel_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, reporter_id)
);
ALTER TABLE public.channel_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own channel reports" ON public.channel_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own channel reports" ON public.channel_reports
  FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage channel reports" ON public.channel_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Them cot detail vao video_reports
ALTER TABLE public.video_reports ADD COLUMN IF NOT EXISTS detail TEXT;

-- Them report_count vao channels
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Trigger tang report_count cho channels + thong bao admin
CREATE OR REPLACE FUNCTION public.handle_channel_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.channels SET report_count = report_count + 1 WHERE id = NEW.channel_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, 'warning', 'Bao cao kenh moi',
    'Co bao cao moi voi ly do: ' || NEW.reason,
    '/admin?section=reports'
  FROM public.user_roles ur WHERE ur.role IN ('admin', 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_channel_report_insert
  AFTER INSERT ON public.channel_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_channel_report();

-- Trigger thong bao admin khi co video report moi
CREATE OR REPLACE FUNCTION public.handle_video_report_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, 'warning', 'Bao cao video moi',
    'Co bao cao video moi voi ly do: ' || NEW.reason,
    '/admin?section=reports'
  FROM public.user_roles ur WHERE ur.role IN ('admin', 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_video_report_insert
  AFTER INSERT ON public.video_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_video_report_notify();
```

### 2. Cai thien ReportSpamButton (video)

| File | Thay doi |
|---|---|
| `src/components/Video/ReportSpamButton.tsx` | Them 2 ly do moi ("harmful", "misinformation"), them textarea "Chi tiet bo sung", gui `detail` kem insert |

### 3. Tao ReportChannelButton

| File | Loai |
|---|---|
| `src/components/Channel/ReportChannelButton.tsx` | Moi |

Component tuong tu ReportSpamButton nhung cho channel, voi cac ly do: spam, impersonation, harassment, misleading, community_violation. Co textarea chi tiet tuy chon. Insert vao `channel_reports`.

### 4. Tich hop ReportChannelButton vao trang Channel

| File | Thay doi |
|---|---|
| `src/pages/Channel.tsx` | Them `ReportChannelButton` ben canh cac action khac (chi hien khi xem kenh nguoi khac, `!isOwnProfile`) |

### 5. Tao trang MyReports (lich su bao cao)

| File | Loai |
|---|---|
| `src/pages/MyReports.tsx` | Moi |

2 tab: "Video da bao cao" va "Kenh da bao cao". Hien thi danh sach bao cao user da gui kem trang thai, ly do, chi tiet, ngay gui.

### 6. Tao tab Admin ReportsManagementTab

| File | Loai |
|---|---|
| `src/components/Admin/tabs/ReportsManagementTab.tsx` | Moi |

2 sub-tab: Video bi bao cao va Kenh bi bao cao. Admin co the xem chi tiet, an/dismiss bao cao, canh cao/suspend user.

### 7. Tich hop vao Admin Dashboard va App routes

| File | Thay doi |
|---|---|
| `src/components/Admin/UnifiedAdminLayout.tsx` | Them `"reports"` vao `AdminSection` type, them nav item (icon: Flag, label: "Bao Cao") |
| `src/pages/UnifiedAdminDashboard.tsx` | Import `ReportsManagementTab`, them case "reports" vao switch, them header text |
| `src/App.tsx` | Them route `/my-reports` tro den `MyReports` page |

### Tong hop file

| File | Loai |
|---|---|
| Migration SQL | Moi |
| `src/components/Video/ReportSpamButton.tsx` | Sua |
| `src/components/Channel/ReportChannelButton.tsx` | Moi |
| `src/pages/Channel.tsx` | Sua |
| `src/pages/MyReports.tsx` | Moi |
| `src/components/Admin/tabs/ReportsManagementTab.tsx` | Moi |
| `src/components/Admin/UnifiedAdminLayout.tsx` | Sua |
| `src/pages/UnifiedAdminDashboard.tsx` | Sua |
| `src/App.tsx` | Sua |

