

# Cập nhật mốc thời gian tính USDT cho Ví 1 và Ví 2

## Vấn đề hiện tại

Code hiện tại dùng chung 1 mốc cutoff cho cả CAMLY và USDT:
- Vi 1: truoc 8/1/2026 (tinh tat ca USDT tu dau -> sai)
- Vi 2: truoc 18/1/2026 (tinh tat ca USDT tu dau -> sai)

Nguoi dung yeu cau moc thoi gian rieng cho USDT:
- Vi 1 USDT: tu **9/12/2025** den **18/1/2026** = **320 USDT**
- Vi 2 USDT: tu **14/1/2026** den **18/1/2026** = **250 USDT**

## Thay doi

### File: `src/components/Admin/tabs/RewardPoolTab.tsx`

**1. Them constant moc thoi gian USDT (dong 82-85)**

```text
// CAMLY cutoffs (giu nguyen)
WALLET1_CUTOFF = "2026-01-09T00:00:00Z"  // CAMLY Vi 1: truoc 8/1
WALLET2_CUTOFF = "2026-01-19T00:00:00Z"  // CAMLY Vi 2: truoc 18/1

// USDT cutoffs (moi)
WALLET1_USDT_START = "2025-12-09T00:00:00Z"  // USDT Vi 1: tu 9/12/2025
WALLET1_USDT_END   = "2026-01-18T00:00:00Z"  // den 18/1/2026
WALLET2_USDT_START = "2026-01-14T00:00:00Z"  // USDT Vi 2: tu 14/1/2026
WALLET2_USDT_END   = "2026-01-18T00:00:00Z"  // den 18/1/2026
```

**2. Sua logic tinh tong (dong 195-222)**

Thay vi chi check `ts < CUTOFF`, kiem tra ca khoang thoi gian start-end cho USDT:

```text
if (from === w1) {
  if (isUsdt) {
    // USDT Vi 1: chi tinh trong khoang 9/12/2025 - 18/1/2026
    if (ts && ts >= WALLET1_USDT_START && ts < WALLET1_USDT_END)
      w1Usdt += amount
  } else {
    // CAMLY Vi 1: truoc 8/1/2026 (giu nguyen)
    if (ts && ts < WALLET1_CUTOFF)
      w1Camly += amount
  }
}
// Tuong tu cho Vi 2 voi WALLET2_USDT_START va WALLET2_USDT_END
```

**3. Sua filter bang giao dich (dong 250-261)**

Dong bo logic loc bang voi logic tinh tong, dam bao bang chi hien giao dich trong khoang thoi gian dung.

**4. Bo logic `!ts && isUsdt` (dong 207-209)**

Khong con tinh USDT thieu timestamp nua (da co du timestamp tu Moralis).

**5. Sua flickering Pool/Gas (dong 164-166)**

Chi hien "Dang tai..." lan dau, khong reset khi polling.

## Ket qua mong doi

| Vi | CAMLY | USDT |
|----|-------|------|
| Vi 1 | 19,701,561 (truoc 8/1) | 320 (9/12 - 18/1) |
| Vi 2 | 3,500,000 (truoc 18/1) | 250 (14/1 - 18/1) |

## Files can sua
1. `src/components/Admin/tabs/RewardPoolTab.tsx`
