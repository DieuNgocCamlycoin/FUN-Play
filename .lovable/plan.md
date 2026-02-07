

# Chuyển Chart CAMLY sang Nền Trắng - CoinMarketCap Style

## Xác Nhận

- **Link CoinMarketCap**: https://coinmarketcap.com/currencies/camly-coin/ ✅
- **CoinGecko ID**: `camly-coin` (dùng để fetch API)

---

## Giải Pháp

Thay thế DexScreener iframe (luôn nền tối) bằng **Custom Chart Recharts** với nền trắng hoàn toàn, dữ liệu từ CoinGecko API.

---

## Files Sẽ Thay Đổi

| File | Hành động |
|------|-----------|
| `src/hooks/useCAMLYPriceHistory.ts` | **Tạo mới** - Hook fetch giá CAMLY từ CoinGecko |
| `src/components/Wallet/CAMLYPriceSection.tsx` | **Cập nhật** - Thay iframe bằng Recharts AreaChart |

---

## Chi Tiết Kỹ Thuật

### 1. Hook mới: `useCAMLYPriceHistory.ts`

```typescript
// Fetch từ CoinGecko API
const COINGECKO_ID = "camly-coin";

export const useCAMLYPriceHistory = (period: "24h" | "7d" | "30d") => {
  // Fetch: https://api.coingecko.com/api/v3/coins/camly-coin/market_chart
  // Return: { priceHistory, loading, currentPrice, priceChange, refetch }
};
```

### 2. Component: `CAMLYPriceSection.tsx`

**Thay đổi:**
- Bỏ DexScreener iframe
- Thêm Recharts AreaChart với nền trắng
- Links: CoinMarketCap + DexScreener + BSCScan
- Timeframes: 24h, 7d, 30d

**Styling Light Mode:**

| Element | Màu |
|---------|-----|
| Background | #FFFFFF |
| Grid Lines | #E5E7EB |
| Text | #9CA3AF |
| Line Tăng | #22c55e |
| Line Giảm | #ef4444 |
| Area Fill | Gradient 30% opacity |

---

## Kết Quả

- Chart nền **TRẮNG** hoàn toàn
- Đồng bộ UI glassmorphism FUN PLAY
- Dữ liệu realtime từ CoinGecko (refresh mỗi 60s)
- Links đến CoinMarketCap, DexScreener, BSCScan

