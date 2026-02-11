

# Nâng cấp truy cập tính năng Phát hiện IP Lạm dụng trên Admin Dashboard

---

## Vấn đề hiện tại

Tính năng **IP Abuse Detection** (phát hiện IP tạo nhiều tài khoản/ví) **đã tồn tại và hoạt động** trong hệ thống. Hiện có **3,046 bản ghi** IP tracking (3,023 wallet_connect + 23 signup).

Tuy nhiên, tính năng này bị **ẩn quá sâu** trong cấu trúc menu:

```text
Admin Dashboard
  └─ CAMLY Rewards (tab chính)
       └─ Lạm Dụng (sub-tab)
            └─ IP Tracking (sub-sub-tab) ← ẩn ở đây
```

Trên **điện thoại di động**, thanh sub-tab 4 cột (`grid-cols-4`) rất nhỏ và khó bấm.

---

## Giải pháp

### 1. Thêm mục "Phát Hiện Lạm Dụng" vào thanh điều hướng chính của Admin

**File: `src/components/Admin/UnifiedAdminLayout.tsx`**

- Thêm section mới `"abuse-detection"` vào `AdminSection` type
- Thêm mục điều hướng mới với icon `Shield` và label "Phát Hiện Lạm Dụng"
- Mục này sẽ hiện trực tiếp trên sidebar (desktop) và trong drawer menu (mobile)

### 2. Tạo trang tổng hợp phát hiện lạm dụng ở cấp cao nhất

**File: `src/pages/UnifiedAdminDashboard.tsx`**

- Thêm case `"abuse-detection"` trong `renderContent()` để render `WalletAbuseTab` trực tiếp
- Thêm tiêu đề và mô tả cho section mới

### 3. Cải thiện giao diện mobile cho WalletAbuseTab

**File: `src/components/Admin/tabs/WalletAbuseTab.tsx`**

- Thay `grid-cols-4` bằng layout responsive: `grid-cols-2 md:grid-cols-4` để sub-tabs dễ bấm hơn trên mobile
- Các card thống kê và danh sách IP group cũng cần responsive tốt hơn

### 4. Cải thiện giao diện mobile cho IPAbuseDetectionTab

**File: `src/components/Admin/tabs/IPAbuseDetectionTab.tsx`**

- Stats grid: `grid-cols-2` trên mobile thay vì `grid-cols-2 md:grid-cols-4` (đã đúng)
- Card header với IP hash và nút "Ban tất cả": chuyển sang dạng xếp dọc trên mobile để không bị tràn
- Avatar list: giữ nguyên vì đã responsive

---

## Tóm tắt file cần thay đổi

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/components/Admin/UnifiedAdminLayout.tsx` | Thêm mục "Phát Hiện Lạm Dụng" vào navigation chính |
| 2 | `src/pages/UnifiedAdminDashboard.tsx` | Thêm section `abuse-detection` vào renderContent |
| 3 | `src/components/Admin/tabs/WalletAbuseTab.tsx` | Responsive sub-tabs: `grid-cols-2 md:grid-cols-4` |
| 4 | `src/components/Admin/tabs/IPAbuseDetectionTab.tsx` | Responsive card header cho mobile (xếp dọc khi hẹp) |

---

## Kết quả

- Admin có thể truy cập **trực tiếp** tính năng phát hiện IP lạm dụng từ menu chính (1 bấm thay vì 3 bấm)
- Trên **điện thoại di động**, giao diện hiển thị rõ ràng, các nút đủ lớn để bấm
- Tính năng vẫn được giữ trong tab "Lạm Dụng" của CAMLY Rewards để không phá vỡ luồng cũ

