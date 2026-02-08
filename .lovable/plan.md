
# Sửa Bố Cục 3 Thẻ Token Lifecycle (LOCKED / ACTIVATED / FLOWING)

## Vấn đề hiện tại
Lưới (grid) hiện tại dùng `grid-cols-3` trên desktop nhưng thực tế có **5 phần tử** trong grid (3 thẻ + 2 mũi tên), dẫn đến:
- Hàng 1: LOCKED | mũi tên | ACTIVATED
- Hàng 2: mũi tên | FLOWING | (trống)

Kết quả: thẻ FLOWING bị rơi xuống hàng thứ 2, mũi tên bị lệch.

## Giải pháp
Chuyển từ CSS Grid sang **Flexbox** cho phần lifecycle states, giúp kiểm soát tốt hơn việc căn chỉnh 3 thẻ + 2 mũi tên trên cùng 1 hàng.

### Desktop (>=768px)
- Dùng `flex` với hướng ngang (row)
- 3 thẻ có chiều rộng bằng nhau (`flex-1`)
- 2 mũi tên ngang nhỏ gọn giữa các thẻ (`shrink-0`)
- Tất cả nằm trên 1 hàng, căn giữa dọc

```text
[ LOCKED ] --> [ ACTIVATED ] --> [ FLOWING ]
```

### Mobile (<768px)
- Dùng `flex` với hướng dọc (column)
- 3 thẻ xếp chồng đầy đủ chiều rộng
- Mũi tên xoay 90 độ, chỉ xuống dưới giữa các thẻ

```text
[ LOCKED    ]
     |
[ ACTIVATED ]
     |
[ FLOWING   ]
```

## Chi tiết kỹ thuật

### File sửa: `src/components/FunMoney/TokenLifecyclePanel.tsx`

**Thay doi 1:** Thay the container grid bang flex layout

Dong 193-197 hien tai:
```
<div className={cn(
  "grid gap-3 mb-6",
  compactMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
)}>
```

Doi thanh:
```
<div className={cn(
  "flex mb-6 gap-3",
  compactMode ? "flex-col" : "flex-col md:flex-row md:items-stretch"
)}>
```

**Thay doi 2:** Sua wrapper cua moi state card

Dong 199 hien tai: `<div key={state.status} className="contents">`

Doi thanh: `<React.Fragment key={state.status}>`

Va bo `</div>` cuoi, doi thanh `</React.Fragment>`

**Thay doi 3:** Them `flex-1` cho moi state card de chia deu chieu rong

Dong 201-208: Them class `flex-1 min-w-0` vao state card div

**Thay doi 4:** Don gian hoa phan mui ten

Dong 257-266 hien tai: 2 div rieng biet cho desktop/mobile

Doi thanh 1 div duy nhat:
```
{index < states.length - 1 && !compactMode && (
  <div className="flex items-center justify-center shrink-0 py-1 md:py-0 md:px-1">
    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground rotate-90 md:rotate-0" />
  </div>
)}
```

## Tong ket
- Chi sua **1 file** duy nhat: `TokenLifecyclePanel.tsx`
- Thay doi nho, tap trung vao phan layout (dong 193-268)
- Ket qua: 3 the nam tren 1 hang tren desktop, xep doc tren mobile, mui ten dung vi tri
