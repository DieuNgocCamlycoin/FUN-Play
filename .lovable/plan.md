

# Ke Hoach Sua 2 Loi FUN Money

## Van De 1: Upload video mint 224 FUN thay vi 100 FUN

**Nguyen nhan**: Trong `scoreAction()` (file `src/lib/fun-money/pplp-engine.ts`), khi khong truyen `qualityMultiplier` va `impactMultiplier`, he thong dung **gia tri mac dinh Q=1.5 va I=1.5**.

Cong thuc: `baseReward × Q × I × K × Ux = 100 × 1.5 × 1.5 × K × Ux`

Voi K xap xi 1.0 va Ux xap xi 1.0, ket qua la ~225 FUN — khop voi 224 FUN ma user thay.

**Giai phap**: Trong hook `useAutoMintFun.ts`, khi goi `submitRequest`, truyen them `qualityMultiplier: 1.0` va `impactMultiplier: 1.0` de dam bao FUN mint = dung base reward (100 FUN cho UPLOAD_VIDEO, 10 FUN cho WATCH_VIDEO, v.v.).

Dong thoi cap nhat `MintRequestInput` interface de ho tro truyen Q va I. Trong `useFunMoneyMintRequest.ts`, forward cac gia tri nay vao `scoreAction()`.

### Chi tiet thay doi:

1. **`src/hooks/useFunMoneyMintRequest.ts`** — Them 2 truong optional `qualityMultiplier` va `impactMultiplier` vao `MintRequestInput`, roi truyen chung vao `scoreAction()`.

2. **`src/hooks/useAutoMintFun.ts`** — Khi goi `submitRequest`, truyen `qualityMultiplier: 1.0` va `impactMultiplier: 1.0` de FUN mint = base reward khong nhan them.

---

## Van De 2: Gia tri FUN = USDT khong dung thuc te

**Nguyen nhan**: Trong `src/hooks/useLightActivity.ts`, dong 67 co `FUN_PRICE_USD = 0.10` — gia tri gia dinh, khong phan anh gia thi truong thuc. FUN Money dang o tren BSC Testnet, chua co gia thi truong that.

Hien thi `≈ $X USD` o `MintableCard.tsx` dong 143 gay hieu nham cho user.

**Giai phap**: 
- Xoa dong hien thi `≈ $X USD` trong `MintableCard.tsx` vi FUN Money chua co gia thi truong (testnet token).
- Xoa hang so `FUN_PRICE_USD` va truong `mintableFunUsd` khoi `useLightActivity.ts` va `LightActivity` interface.
- Thay bang dong chu: "Token tren BSC Testnet — chua co gia thi truong"

---

## Tong Ket Thay Doi

| File | Thay doi |
|------|---------|
| `src/hooks/useFunMoneyMintRequest.ts` | Them `qualityMultiplier?` va `impactMultiplier?` vao `MintRequestInput`, forward vao `scoreAction()` |
| `src/hooks/useAutoMintFun.ts` | Truyen `qualityMultiplier: 1.0`, `impactMultiplier: 1.0` khi goi `submitRequest` |
| `src/hooks/useLightActivity.ts` | Xoa `FUN_PRICE_USD`, xoa `mintableFunUsd` khoi `calculateMintableFun` va `LightActivity` |
| `src/components/FunMoney/MintableCard.tsx` | Thay `≈ $X USD` bang thong bao testnet token |

## Ket qua mong doi

- UPLOAD_VIDEO mint dung 100 FUN (khong nhan them Q/I multiplier)
- WATCH_VIDEO = 10 FUN, LIKE_VIDEO = 5 FUN, COMMENT = 15 FUN, SHARE = 20 FUN
- Khong con hien thi gia USDT ao cho FUN Money

