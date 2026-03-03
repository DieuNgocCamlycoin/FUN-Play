

## Kế hoạch sửa: Đồng bộ số liệu MintableCard

### Nguyên nhân
- `totalFunReward` (Tổng FUN) = sum of `count × baseFun` — **chưa nhân multipliers**
- `mintableFun` = `totalMultipliedReward - alreadyMintedFun` — **đã nhân multipliers**
- → Mâu thuẫn: Mintable > Tổng FUN, vô lý về mặt logic hiển thị

### Giải pháp
Sửa `MintableCard.tsx` để "Tổng FUN" hiển thị `totalMultipliedReward` thay vì `totalFunReward`, đảm bảo phép toán nhất quán:

**Mintable FUN = Tổng FUN (after multipliers) − Đã Mint**

Cụ thể chỉ sửa 1 dòng trong `MintableCard.tsx`:
```diff
- <p className="text-2xl font-bold text-primary">{(activity.totalFunReward ?? 0).toLocaleString()}</p>
+ <p className="text-2xl font-bold text-primary">{(activity.totalMultipliedReward ?? 0).toLocaleString()}</p>
```

Tất cả 3 số liệu sẽ cùng hệ quy chiếu "sau multipliers":
- Tổng FUN = totalMultipliedReward (ví dụ ~18,638)
- Đã Mint = 3,530
- Mintable = 18,638 - 3,530 = 15,108 ✓

### Files sửa
- **`src/components/FunMoney/MintableCard.tsx`**: Thay `totalFunReward` → `totalMultipliedReward` tại dòng hiển thị "Tổng FUN"

