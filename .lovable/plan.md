

## Nang cap tuong tac trang Admin Quan ly Video (Spam Filter)

### Tong quan
Them 3 tinh nang chinh cho tat ca cac tab trong Spam Filter (Reported, Short, Duplicate, Sample):
1. Click thumbnail/title de xem video trong Modal
2. Click ten Owner de mo trang ca nhan trong tab moi
3. Nut "Xoa Video" va "Khoa User" ngay trong Modal xem video

### Chi tiet ky thuat

**File thay doi:** `src/components/Admin/tabs/VideosManagementTab.tsx`

#### 1. Cap nhat truy van `fetchSpamVideos` - them truong `video_url`
- Hien tai query khong lay truong `video_url`, can bo sung de co the phat video trong Modal
- Them `video_url` vao select query dong 643

#### 2. Them state cho Video Preview Modal
- `previewVideo`: luu video dang xem (hoac null)
- `previewOpen`: boolean dieu khien hien thi Modal

#### 3. Click Thumbnail / Title de mo Modal xem video
- Boc thumbnail (dong 898-904) va title (dong 906) trong `cursor-pointer` va `onClick` de set `previewVideo`
- Video chi duoc load (stream) khi Modal mo = dung the `<video>` voi `src` chi khi `previewOpen === true` (On Demand)

#### 4. Click ten Owner de mo trang ca nhan
- Thay `<span>` (dong 920) thanh `<a>` voi `href="https://official-funplay.lovable.app/c/${profile.username}"` va `target="_blank"`
- Giu nguyen Tooltip hien thi thong ke video

#### 5. Modal xem video voi Quick Actions
- Dung component `Dialog` co san (da import)
- Noi dung Modal:
  - Tieu de video
  - The `<video>` phat video (chi render khi Modal mo)
  - Thong tin Owner + link
  - 2 nut hanh dong:
    - "Xoa Video": Goi `supabase.rpc("bulk_delete_videos_only")` voi 1 video, dong Modal, refresh list
    - "Khoa User": Goi `handleQuickBan()` co san, dong Modal, refresh list

#### 6. Ham xu ly trong Modal
```text
handleDeleteFromModal(videoId):
  - Goi bulk_delete_videos_only voi [videoId]
  - Toast thanh cong
  - Dong Modal
  - fetchSpamVideos()
  - onReportCountChange()

handleBanFromModal(userId, username):
  - Goi handleQuickBan(userId, username)
  - Dong Modal
```

### Khong thay doi
- Khong tao file moi - tat ca thay doi trong 1 file duy nhat
- Khong thay doi logic cua cac Dialog xac nhan hien co (Delete Only, Delete & Ban, Report Detail)
- Khong anh huong den tab Approval hay Stats

### Tac dong
- Tiet kiem tai nguyen: Video chi load khi Admin mo Modal
- Thao tac nhanh hon: Xem video + xu ly ngay trong 1 cua so
- Kiem tra Owner nhanh: 1 click mo trang ca nhan

