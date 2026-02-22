

## Tính năng Báo cáo Channel, Cải thiện Báo cáo Video + Lịch sử Báo cáo + Tab Admin

### Tổng quan
1. Tạo bảng `channel_reports` + cập nhật bảng `video_reports` (thêm cột `detail`)
2. Thêm nút báo cáo kênh trên trang Channel
3. Cải thiện dialog báo cáo video (thêm chi tiết, thêm lý do)
4. Tạo trang "Lịch sử báo cáo" cho user xem lại các báo cáo đã gửi
5. Tạo tab "Báo cáo" trong Admin Dashboard + thông báo cho admin

---

### 1. Database Migration

**Tạo bảng `channel_reports`:**
```sql
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
-- RLS: insert own, select own, admin full access
```

**Thêm cột cho `channels`:**
```sql
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
```

**Thêm cột `detail` cho `video_reports`:**
```sql
ALTER TABLE public.video_reports ADD COLUMN IF NOT EXISTS detail TEXT;
```

**Trigger `handle_channel_report`:** Tăng `report_count` trên `channels`, gửi notification cho admin.

**Cập nhật `handle_video_report`:** Gửi notification cho admin khi có báo cáo video mới.

---

### 2. Component: ReportChannelButton

| File | Loại |
|---|---|
| `src/components/Channel/ReportChannelButton.tsx` | Mới |

Tương tự `ReportSpamButton`, với lý do:
- spam, impersonation, harassment, misleading, community_violation
- Textarea chi tiết tùy chọn
- Insert vào `channel_reports`

---

### 3. Tích hợp vào trang Channel

| File | Thay đổi |
|---|---|
| `src/pages/Channel.tsx` | Thêm `ReportChannelButton` (chỉ hiển thị khi xem kênh người khác) |

---

### 4. Cải thiện ReportSpamButton (video)

| File | Thay đổi |
|---|---|
| `src/components/Video/ReportSpamButton.tsx` | Thêm textarea "Chi tiết", thêm lý do "harmful" và "misinformation", gửi `detail` kèm insert |

---

### 5. Trang Lịch sử Báo cáo (cho user)

| File | Loại |
|---|---|
| `src/pages/MyReports.tsx` | Mới |
| `src/App.tsx` | Thêm route `/my-reports` |

Hiển thị 2 tab:
- **Video đã báo cáo**: Query `video_reports` where `reporter_id = user.id`, join thông tin video (title, thumbnail)
- **Kênh đã báo cáo**: Query `channel_reports` where `reporter_id = user.id`, join thông tin channel (name)

Mỗi item hiển thị: tên video/kênh, lý do, chi tiết, ngày báo cáo, trạng thái (pending/reviewed/dismissed).

Có thể truy cập từ menu Settings hoặc profile dropdown.

---

### 6. Tab Admin: Quản lý Báo cáo

| File | Loại |
|---|---|
| `src/components/Admin/tabs/ReportsManagementTab.tsx` | Mới |
| `src/components/Admin/UnifiedAdminLayout.tsx` | Sửa: thêm "reports" vào `AdminSection`, thêm nav item |
| `src/pages/UnifiedAdminDashboard.tsx` | Sửa: thêm case "reports" vào switch |

2 sub-tab:
- **Video bị báo cáo**: Danh sách video kèm report_count, lý do, chi tiết, hành động (ẩn/dismiss)
- **Kênh bị báo cáo**: Danh sách kênh kèm report_count, lý do, chi tiết, hành động (cảnh cáo/suspend/dismiss)

---

### Tổng hợp file

| File | Loại |
|---|---|
| Migration SQL | Mới |
| `src/components/Channel/ReportChannelButton.tsx` | Mới |
| `src/components/Admin/tabs/ReportsManagementTab.tsx` | Mới |
| `src/pages/MyReports.tsx` | Mới |
| `src/App.tsx` | Sửa (thêm route) |
| `src/pages/Channel.tsx` | Sửa |
| `src/components/Video/ReportSpamButton.tsx` | Sửa |
| `src/components/Admin/UnifiedAdminLayout.tsx` | Sửa |
| `src/pages/UnifiedAdminDashboard.tsx` | Sửa |

