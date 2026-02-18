
# Don Dep Header Admin Dashboard

## Van De
Tren trang Overview, hien tai co **2 nut Refresh** va **1 badge "Online"** gay nham lan:

1. **Nut Refresh o header** (goc tren phai, ben canh "Online"): Chi refresh so lieu nho tu `useAdminRealtime` (pending count, active users). Xuat hien tren **tat ca** cac tab, ke ca khi khong can.
2. **Nut Refresh trong OverviewTab**: Refresh du lieu chi tiet (tong users, videos, charts, top creators/earners). Day moi la nut chinh.
3. **Badge "Online"**: Truoc day la chi bao ket noi Realtime WebSocket. Sau khi go bo Realtime, badge nay luon hien "Online" va **khong co tac dung gi**.

## Giai Phap
Xoa nut Refresh va badge "Online" khoi header chinh (`UnifiedAdminDashboard.tsx`), chi giu lai Refresh rieng cua tung tab (OverviewTab, UsersManagementTab...).

## Chi Tiet Ky Thuat

### File: `src/pages/UnifiedAdminDashboard.tsx`
- **Xoa** khoi dong 180-198: Toan bo block "Status & Refresh" (nut Refresh header + badge Online)
- **Xoa** import `Wifi` va `RefreshCw` (khong con dung)
- **Xoa** import `Badge` (khong con dung)
- **Xoa** import `Button` (kiem tra xem co dung o cho khac khong - neu khong thi xoa)
- **Xoa** `realtimeStats` va `useAdminRealtime` hook call (dong 32) vi khong con dung o component nay
- **Xoa** import `useAdminRealtime` (dong 24)
- **Xoa** bien `pendingCount` (dong 107-109) vi no phu thuoc vao `realtimeStats`
- Cap nhat prop `pendingCount` cua `UnifiedAdminLayout` de dung `stats.pendingCount` truc tiep tu `useAdminManage`

### Ket Qua
- Giao dien sach hon, khong con 2 nut Refresh gay nham lan
- Xoa badge "Online" vo nghia
- Giam code khong can thiet, tiet kiem tai nguyen
