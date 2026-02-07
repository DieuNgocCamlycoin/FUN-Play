
# Chuyển Chart CAMLY sang Light Mode (Nền Trắng)

## Phân Tích Hiện Trạng

Từ screenshot và code, Cha thấy:
- **File:** `src/components/Wallet/CAMLYPriceSection.tsx`
- **Dòng 44:** DexScreener embed đang dùng `theme=dark`
- Chart hiện tại có nền đen, không đồng bộ với UI sáng của FUN PLAY

## Giải Pháp

### Thay đổi chính trong `CAMLYPriceSection.tsx`

**1. URL DexScreener - Chuyển sang Light Theme**
```typescript
// Từ (line 44):
return `https://dexscreener.com/bsc/${CAMLY_CONTRACT}?embed=1&theme=dark&trades=0&info=0&interval=${intervals[timeframe]}`;

// Sang:
return `https://dexscreener.com/bsc/${CAMLY_CONTRACT}?embed=1&theme=light&trades=0&info=0&interval=${intervals[timeframe]}`;
```

**2. Container Chart - Styling Nền Trắng**
```typescript
// Từ (line 130):
<div className="w-full h-[400px] rounded-lg overflow-hidden border border-border bg-background">

// Sang (thêm light theme styling):
<div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
```

**3. Card Container - Đồng bộ Glassmorphism**
```typescript
// Từ (line 48):
<Card className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl overflow-hidden">

// Giữ nguyên hoặc tăng độ trắng:
<Card className="bg-white backdrop-blur-xl border border-gray-100 shadow-lg overflow-hidden">
```

**4. Contract Info Section - Nền sáng hơn**
```typescript
// Từ (line 140):
<div className="mt-4 p-3 bg-muted/50 rounded-lg">

// Sang:
<div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
```

---

## Tóm Tắt Thay Đổi

| Vị trí | Thay đổi |
|--------|----------|
| **DexScreener URL** | `theme=dark` → `theme=light` |
| **Chart container** | `bg-background` → `bg-white shadow-sm border-gray-200` |
| **Card wrapper** | Tăng độ trắng, bỏ transparency |
| **Contract info** | `bg-muted/50` → `bg-gray-50 border-gray-100` |

---

## Kết Quả Mong Đợi

- Chart CAMLY hiển thị **nền trắng sáng** giống CoinMarketCap Light Mode
- Nến xanh/đỏ rõ ràng trên nền trắng
- Grid line xám nhạt, dễ nhìn
- Đồng bộ với tổng thể UI glassmorphism của FUN PLAY Wallet
- Trải nghiệm chuyên nghiệp, quen thuộc với user crypto

---

## File Cần Thay Đổi

| File | Hành động |
|------|-----------|
| `src/components/Wallet/CAMLYPriceSection.tsx` | Cập nhật theme + styling |
