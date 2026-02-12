

# Cập nhật "Thưởng bằng tay" trên 3 trang: Reward Pool, Users Directory, User Stats

## Vấn đề gốc

Việc đổi tên ví trong `systemWallets.ts` chỉ ảnh hưởng đến trang **Lịch sử giao dịch** (`/transactions`). Ba trang còn lại không gọi hàm `getSystemWalletInfo()` nên không có thay đổi nào hiển thị.

Để hiển thị dữ liệu "Thưởng bằng tay" (CAMLY gửi trực tiếp từ Ví tặng thưởng 1 và Ví tặng thưởng 2), cần cập nhật ở cả 3 tầng: **Database RPC**, **Hooks**, và **Giao diện UI**.

---

## Bước 1: Cập nhật Database RPC (Migration SQL)

Cập nhật 2 hàm RPC `get_public_users_directory` và `get_users_directory_stats` để thêm cột `manual_rewards`.

Cột mới này tính tổng CAMLY mà user nhận trực tiếp từ 2 ví hệ thống bằng cách JOIN vào bảng `wallet_transactions`:

- Lọc `from_address` thuộc Ví tặng thưởng 1 (`0x1DC2...`) hoặc Ví tặng thưởng 2 (`0x7b32...`)
- Lọc `token_contract` là CAMLY (`0x0910...`)
- Lọc `status = 'completed'`
- Match `to_address` với `wallet_address` của user trong bảng `profiles`

---

## Bước 2: Cập nhật Hooks

### `src/hooks/usePublicUsersDirectory.ts`
- Thêm field `manual_rewards: number` vào interface `PublicUserStat`

### `src/hooks/useUsersDirectoryStats.ts`
- Thêm field `manual_rewards: number` vào interface `UserDirectoryStat`

---

## Bước 3: Cập nhật RewardBreakdownGrid

**File**: `src/components/Rewards/RewardBreakdownGrid.tsx`

- Thêm `manual_rewards` vào interface `RewardBreakdown`
- Thêm item mới trong danh sách `REWARD_ITEMS` với icon `HandCoins` (từ lucide-react) và màu `text-rose-500`
- Label: "Thưởng tay"

---

## Bước 4: Cập nhật trang Reward Pool (Admin)

**File**: `src/components/Admin/tabs/RewardPoolTab.tsx`

Thêm section mới "Tổng hợp thưởng bằng tay":

- **Card 1**: Tổng CAMLY đã gửi từ Ví tặng thưởng 1 (query từ `wallet_transactions`)
- **Card 2**: Tổng CAMLY đã gửi từ Ví tặng thưởng 2
- **Card 3**: Tổng hợp cả 2 ví
- **Bảng "Thưởng bằng tay gần đây"**: Lấy 50 giao dịch gần nhất từ `wallet_transactions` WHERE `from_address` IN (2 ví hệ thống), hiển thị: tên user (lookup từ `profiles` qua `wallet_address`), số lượng CAMLY, ngày giờ, link TX hash trên BscScan

---

## Bước 5: Cập nhật trang Users Directory

**File**: `src/pages/UsersDirectory.tsx`

Trong phần mở rộng (expandable row), dữ liệu `manual_rewards` sẽ tự động hiển thị qua component `RewardBreakdownGrid` (vì đã thêm vào interface ở Bước 3).

---

## Bước 6: Cập nhật trang User Stats (Admin)

**File**: `src/components/Admin/tabs/UserStatsTab.tsx`

Tương tự, dữ liệu `manual_rewards` sẽ tự động hiển thị qua `RewardBreakdownGrid` trong phần mở rộng.

---

## Chi tiết kỹ thuật

### Files cần sửa (7 files):

1. **Migration SQL** — Cập nhật 2 RPC thêm cột `manual_rewards`
2. `src/hooks/usePublicUsersDirectory.ts` — Thêm field `manual_rewards`
3. `src/hooks/useUsersDirectoryStats.ts` — Thêm field `manual_rewards`
4. `src/components/Rewards/RewardBreakdownGrid.tsx` — Thêm `manual_rewards` vào interface và REWARD_ITEMS
5. `src/components/Admin/tabs/RewardPoolTab.tsx` — Thêm section thưởng bằng tay + bảng giao dịch gần đây
6. `src/pages/UsersDirectory.tsx` — Không cần sửa thêm (tự động qua RewardBreakdownGrid)
7. `src/components/Admin/tabs/UserStatsTab.tsx` — Không cần sửa thêm (tự động qua RewardBreakdownGrid)

### Thứ tự thực hiện:
1. Chạy migration SQL cập nhật 2 RPC
2. Cập nhật 2 hooks (interfaces)
3. Cập nhật RewardBreakdownGrid (thêm manual_rewards)
4. Cập nhật RewardPoolTab (thêm section thưởng bằng tay)
5. Kiểm tra dữ liệu trên cả 3 trang

