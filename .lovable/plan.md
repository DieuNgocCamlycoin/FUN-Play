

## Nang cap tab "Tat Ca Video" trong Quan Ly Video

### Van de hien tai

Tab "Duyet Video" (approval) hien la tab mac dinh nhung khong co che do xem toan bo video voi day du chi tiet. Tab "Thong Ke" co bang video nhung thieu cac hanh dong quan tri (xoa, treo thuong, nhac nho...) va thieu thong tin chi tiet khi click vao dong.

### Giai phap

Them tab moi **"Tat Ca Video"** (All Videos) lam tab mac dinh, tuong tu nhu AllUsersTab da lam cho User Management, voi:

1. Bang hien thi day du thong tin moi video
2. Click vao dong de mo chi tiet (Collapsible)
3. Menu "..." voi cac hanh dong admin
4. Tim kiem, loc, phan trang

### Chi tiet ky thuat

**Tep thay doi:**

| STT | Tep | Noi dung |
|-----|------|----------|
| 1 | `src/components/Admin/tabs/AllVideosTab.tsx` | **TAO MOI** - Component bang video chi tiet voi Collapsible, DropdownMenu hanh dong, tim kiem, phan trang |
| 2 | `src/components/Admin/tabs/VideosManagementTab.tsx` | Them tab "Tat Ca Video" su dung AllVideosTab, dat lam tab mac dinh |

**Bang du lieu hien thi (AllVideosTab):**

| # | Thumbnail + Tieu de | Nguoi tai | Views | Likes | Comments | Thoi luong | Dung luong | Trang thai | Ngay | ... |

**Menu hanh dong "..." cho moi video (DropdownMenu):**
- Xem video (mo dialog preview)
- Mo trang video (tab moi)
- Duyet thuong / Tu choi thuong
- Treo thuong video (dong bang reward cua video nay)
- An video (is_hidden = true)
- Hien video (is_hidden = false, neu da an)
- Xoa video (voi dialog xac nhan)
- Xem profile nguoi tai (tab moi)

**Click vao dong de mo chi tiet (Collapsible):**
- Mo ta video
- URL video + thumbnail
- Category, sub_category
- file_size, duration, slug
- approval_status, is_hidden, report_count
- Ngay tao, ngay cap nhat
- Video player inline

**Tinh nang loc:**
- Tim kiem theo tieu de
- Loc theo trang thai: Tat ca / Da duyet / Cho duyet / Da tu choi / Da an
- Sap xep theo: Moi nhat, Views cao nhat, Reports nhieu nhat

**Du lieu duoc fetch truc tiep tu Supabase** (tuong tu VideoApprovalContent), khong can tao RPC moi. Query se join `profiles` va `channels`, phan trang 20 video/trang.

**Logic cac hanh dong admin:**
- **Duyet/Tu choi**: Update `approval_status` (da co san trong VideoApprovalContent)
- **An/Hien video**: Update `is_hidden`
- **Xoa video**: Delete tu bang `videos` (cascade se xoa likes, comments, rewards lien quan)
- **Treo thuong**: Update `approval_status = 'rejected'` + gui thong bao

### Ket qua mong doi

- Tab "Tat Ca Video" la tab mac dinh khi mo Quan Ly Video
- Hien thi toan bo video voi chi tiet tuong tu AllUsersTab
- Admin co the thao tac nhanh qua menu "..." ma khong can chuyen tab
- Click vao dong de xem chi tiet day du + video player
- Tim kiem, loc, phan trang hoat dong muot ma

