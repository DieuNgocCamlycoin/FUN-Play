

## Hoàn thiện Hệ thống Báo cáo Video - FUN Play

### Hiện trạng

- **ReportSpamButton**: Hoạt động trên cả Web (`Watch.tsx`) va Mobile (`VideoActionsBar.tsx`), nhung ly do chua khop voi yeu cau.
- **video_reports table**: Thieu cot `status` (chi co `id, video_id, reporter_id, reason, created_at`).
- **Admin Spam Filter**: Hien thi `report_count` badge nhung **khong co chuc nang xem chi tiet ly do bao cao** khi click vao tag.
- **Debounce**: Chua co tren nut "Gui bao cao".

---

### Thay doi

#### 1. Database Migration - Them cot `status` vao `video_reports`

Them cot `status` (mac dinh `'pending'`) de Admin co the theo doi trang thai xu ly bao cao.

```sql
ALTER TABLE public.video_reports 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
```

#### 2. Cap nhat ly do bao cao (ReportSpamButton.tsx)

Thay doi danh sach `REPORT_REASONS` theo yeu cau:
- "Noi dung rac / Spam"
- "Trung lap"
- "Video qua ngan / Chat luong thap"
- "Vi pham quy tac cong dong"

Cap nhat thong bao thanh cong: **"Cam on ban da dong gop anh sang cho cong dong"**

Them debounce cho nut "Gui bao cao" (chong nhan lien tuc) bang cach disable nut sau khi nhan va them `useRef` timeout 2 giay.

#### 3. Admin - Xem chi tiet ly do bao cao (VideosManagementTab.tsx)

Khi Admin click vao Badge "X bao cao" trong bang Spam Filter:
- Mo Dialog hien thi danh sach tat ca ly do bao cao tu `video_reports` table
- Hien thi: nguoi bao cao, ly do, thoi gian bao cao
- Truy van: `supabase.from("video_reports").select("*, profiles:reporter_id(display_name, username, avatar_url)").eq("video_id", videoId)`

#### 4. Toi uu Cloud

- Chi gui request khi User nhan "Gui" (da dung nhu vay).
- Them debounce 2 giay sau khi gui thanh cong de chong spam request.

---

### Chi tiet ky thuat

**Files thay doi:**

| File | Thay doi |
|------|----------|
| Database migration | Them cot `status` vao `video_reports` |
| `src/components/Video/ReportSpamButton.tsx` | Cap nhat ly do, thong bao, debounce |
| `src/components/Admin/tabs/VideosManagementTab.tsx` | Them Dialog xem chi tiet ly do bao cao khi click Badge |

**ReportSpamButton - Ly do moi:**
```typescript
const REPORT_REASONS = [
  { value: "spam", label: "Noi dung rac / Spam" },
  { value: "duplicate", label: "Trung lap" },
  { value: "low_quality", label: "Video qua ngan / Chat luong thap" },
  { value: "community_violation", label: "Vi pham quy tac cong dong" },
];
```

**Admin Report Detail Dialog:**
- Badge `report_count` trong bang Spam Filter se tro thanh clickable
- Click mo Dialog voi danh sach bao cao tu `video_reports` join `profiles`
- Hien thi avatar, ten nguoi bao cao, ly do, thoi gian

**Debounce:**
- Sau khi gui bao cao thanh cong, disable nut 2 giay bang `useState` + `setTimeout`
- Chong nguoi dung nhan lien tuc

