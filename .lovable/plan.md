

## Ket qua Kiem tra He thong Bao cao Video

### Trang thai hien tai: HE THONG DANG HOAT DONG BINH THUONG

Sau khi kiem tra ky luong, he thong bao cao video da hoat dong dung:

- **Database**: 1 bao cao ton tai cho video `c58723a7...`, `report_count = 1`
- **Trigger `handle_video_report`**: Tang `report_count` tu dong khi co bao cao moi
- **RLS Policies**: Admin da co quyen SELECT, UPDATE, DELETE tren bang `videos` va `video_reports`
- **ReportSpamButton**: Hoat dong tren ca Web va Mobile voi debounce 2 giay
- **Spam Filter Tab**: Mac dinh hien thi video bi bao cao, co nut Refresh, co Badge so luong

### Ly do truoc do khong thay video bao cao

Cac chinh sach RLS cho admin tren bang `videos` **vua moi duoc them** trong phien truoc. Truoc do, admin chi co the thay video `is_public = true` hoac video do chinh ho tao. Hien tai van de nay da duoc giai quyet.

### Cai tien nho de tang do tin cay

Muc du he thong da hoat dong, co mot so cai tien nho giup dong bo tot hon:

1. **Dong bo badge count sau khi admin thao tac**: Khi admin an/xoa/ban video trong Spam Filter, badge so luong tren tab "Spam Filter" khong tu dong cap nhat. Can truyen callback de refresh count.

2. **Tu dong chuyen sang tab "Bi bao cao" khi co bao cao moi**: Hien tai Spam Filter mac dinh la "reported" khi mount, nhung khong tu dong refresh khi admin quay lai tab.

### Chi tiet ky thuat

**File thay doi:**

| File | Thay doi |
|------|----------|
| `src/components/Admin/tabs/VideosManagementTab.tsx` | Truyen callback `onReportCountChange` tu `VideosManagementTab` vao `SpamFilterContent` de dong bo badge count khi admin thao tac (an/xoa/ban). Sau moi hanh dong bulk, goi lai `fetchReportedCount()` |

**Logic thay doi:**
- Chuyen `fetchReportedCount` thanh function co the goi lai
- Truyen no vao `SpamFilterContent` nhu prop
- Goi lai sau moi hanh dong: `handleBulkHide`, `handleBulkDeleteOnly`, `handleBulkDeleteBan`

Day la thay doi nho, khong anh huong den logic chinh cua he thong.

