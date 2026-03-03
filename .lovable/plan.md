

## Kế hoạch: Trang quản lý GOV Attester cho Admin

### Hiện trạng
9 ví GOV Attester hiện được **hardcode** trong `src/lib/fun-money/pplp-multisig-config.ts`. Không có cách nào thay đổi thành viên mà không sửa code.

### Mục tiêu
Tạo bảng `gov_attesters` trong database và trang admin để quản lý 3 nhóm GOV (WILL, WISDOM, LOVE) — xem, thêm, sửa, xóa thành viên.

### Thay đổi kỹ thuật

#### 1. Database Migration — Tạo bảng `gov_attesters`
```sql
CREATE TABLE public.gov_attesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gov_group TEXT NOT NULL CHECK (gov_group IN ('will', 'wisdom', 'love')),
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_address)
);
```
- RLS: chỉ admin được CRUD, authenticated users được SELECT (cần đọc để verify chữ ký)
- Seed 9 thành viên hiện tại vào bảng

#### 2. Tạo component `GovAttesterManagementTab.tsx`
- Hiển thị 3 nhóm GOV dưới dạng cards (WILL, WISDOM, LOVE)
- Mỗi card liệt kê thành viên: tên, địa chỉ ví (rút gọn), trạng thái active/inactive
- Nút thêm thành viên mới (dialog với form: tên, địa chỉ ví, chọn nhóm)
- Nút sửa/xóa (toggle active) cho từng thành viên
- Hiển thị cảnh báo nếu nhóm nào có ít hơn 1 thành viên active

#### 3. Cập nhật `pplp-multisig-config.ts`
- Thêm hook `useGovAttesters()` để fetch từ database thay vì hardcode
- Giữ lại hardcode config làm **fallback** khi chưa có data trong DB
- Các helper functions (`getGroupForAddress`, `isAttesterAddress`...) sẽ ưu tiên dùng DB data

#### 4. Đăng ký tab mới trong Admin Layout
- Thêm section `"gov-attesters"` vào `AdminSection` type trong `UnifiedAdminLayout.tsx`
- Thêm nav item với icon `Users` và label "GOV Attesters"
- Thêm case trong `UnifiedAdminDashboard.tsx` để render tab mới

### Không thay đổi
- Smart contract (quản lý attester on-chain là việc riêng)
- Logic ký multisig trong `AttesterPanel` / `useAttesterSigning`
- Luồng mint đã tích hợp multisig 3-of-3

