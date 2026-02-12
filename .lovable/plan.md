

# Cập nhật mốc Ví 1 và xóa bảng "Thưởng bằng tay gần đây"

## Thay đổi

### 1. Xóa mục "Thưởng bằng tay gần đây"
Xóa toàn bộ card "Thưởng bằng tay gần đây" (dòng 494-562) vì đã có bảng chi tiết khi nhấn vào từng ô ví.

### 2. Cập nhật mốc thời gian Ví 1
Thay đổi ngày bắt đầu Ví 1 từ `9/12/2025` sang `25/11/2025`, và ngày kết thúc từ `18/1/2026` sang `8/1/2026` (bao gồm ngày 8/1, tức `< 2026-01-09`).

Số liệu đã xác nhận từ database:
- **Ví 1** (25/11/2025 – 8/1/2026): **19,701,561 CAMLY** (60 tx) + **491 USDT** (41 tx)
- **Ví 2** (14/1/2026 – 18/1/2026): giữ nguyên

### Chi tiết kỹ thuật

**File: `src/components/Admin/tabs/RewardPoolTab.tsx`**

**A. Sửa constants (dòng 84-85):**
```
WALLET1_START = "2025-11-25T00:00:00Z"  // từ 25/11/2025
WALLET1_END   = "2026-01-09T00:00:00Z"  // đến hết 8/1/2026
```

**B. Cập nhật mô tả card Ví 1:**
Đổi text từ "9/12/2025 – 18/1/2026" sang "25/11/2025 – 8/1/2026"

**C. Xóa block "Thưởng bằng tay gần đây" (dòng 494-562)**

| Ví | CAMLY | USDT | Khoảng thời gian |
|----|-------|------|------------------|
| Ví 1 | 19,701,561 | 491 | 25/11/2025 – 8/1/2026 |
| Ví 2 | 2,500,000 | 250 | 14/1/2026 – 18/1/2026 |

### File cần sửa
1. `src/components/Admin/tabs/RewardPoolTab.tsx`
