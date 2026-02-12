

# Cập nhật mốc CAMLY và thêm chi tiết khi nhấn vào ô ví

## Thay đổi chính

### 1. Cập nhật mốc thời gian CAMLY (dùng chung với USDT)

Bỏ `WALLET1_CUTOFF` và `WALLET2_CUTOFF` cũ. Cả CAMLY và USDT dùng chung khoảng thời gian:

| Ví | Từ ngày | Đến ngày | CAMLY | USDT |
|----|---------|----------|-------|------|
| Ví 1 | 9/12/2025 | 18/1/2026 | 17,521,473 (36 tx) | 320 (8 tx) |
| Ví 2 | 14/1/2026 | 18/1/2026 | 2,500,000 (5 tx) | 250 (5 tx) |

Sử dụng constants đơn giản hơn:
- `WALLET1_START = "2025-12-09"`, `WALLET1_END = "2026-01-18"`
- `WALLET2_START = "2026-01-14"`, `WALLET2_END = "2026-01-18"`

### 2. Nhấn vào ô ví -> hiện danh sách giao dịch

Thêm state `selectedWallet` ("w1" | "w2" | null). Khi nhấn vào card ví:
- Lọc `manualTxs` theo `from_wallet`
- Hiện bảng chi tiết bên dưới card (giống bảng "Thưởng bằng tay gần đây") gồm: thời gian, người nhận (avatar + tên kênh + link profile), số lượng, token (CAMLY/USDT), link TX
- Nhấn lại để đóng

### 3. Cập nhật trên mobile

- Card ví có hiệu ứng nhấn (cursor-pointer, hover)
- Bảng chi tiết responsive (overflow-x-auto)
- Giữ nguyên bảng "Thưởng bằng tay gần đây" hiện tất cả giao dịch từ cả 2 ví

## Chi tiết kỹ thuật

### File: `src/components/Admin/tabs/RewardPoolTab.tsx`

**A. Constants mới (thay thế dòng 83-91)**

```text
WALLET1_START = "2025-12-09T00:00:00Z"
WALLET1_END   = "2026-01-18T00:00:00Z"
WALLET2_START = "2026-01-14T00:00:00Z"
WALLET2_END   = "2026-01-18T00:00:00Z"
```

**B. Logic tính tổng (dòng 208-226)**

```text
if (from === w1) {
  if (ts && ts >= WALLET1_START && ts < WALLET1_END) {
    if (isUsdt) w1Usdt += amount;
    else w1Camly += amount;
  }
} else if (from === w2) {
  if (ts && ts >= WALLET2_START && ts < WALLET2_END) {
    if (isUsdt) w2Usdt += amount;
    else w2Camly += amount;
  }
}
```

**C. Filter bảng (dòng 255-268)**

```text
if (from === w1) return ts >= WALLET1_START && ts < WALLET1_END;
if (from === w2) return ts >= WALLET2_START && ts < WALLET2_END;
```

**D. State + UI cho chọn ví (mới)**

```text
const [selectedWallet, setSelectedWallet] = useState<"w1"|"w2"|null>(null);

// Card ví 1: onClick={() => setSelectedWallet(s => s === "w1" ? null : "w1")}
// Card ví 2: onClick={() => setSelectedWallet(s => s === "w2" ? null : "w2")}

// Bảng chi tiết ví được chọn (hiện ngay dưới 2 card)
const selectedTxs = manualTxs.filter(tx => 
  selectedWallet === "w1" ? tx.from_wallet === "Ví 1" : tx.from_wallet === "Ví 2"
);
```

**E. Mô tả card ví cập nhật**
- Ví 1: "9/12/2025 – 18/1/2026"
- Ví 2: "14/1/2026 – 18/1/2026"

### Kết quả mong đợi

| Ví | CAMLY | USDT |
|----|-------|------|
| Ví 1 | 17,521,473 | 320 |
| Ví 2 | 2,500,000 | 250 |

### File cần sửa
1. `src/components/Admin/tabs/RewardPoolTab.tsx`

