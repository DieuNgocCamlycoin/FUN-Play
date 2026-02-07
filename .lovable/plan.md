
# 🛠️ Fix Dropdown Bị Che Khuất Trong Modal "Thưởng & Tặng"

## 📊 Phân Tích Nguyên Nhân

### Vấn đề hiện tại:
| Component | z-index hiện tại | Vấn đề |
|-----------|------------------|--------|
| DialogOverlay | `z-[10001]` | ✅ OK |
| DialogContent | `z-[10002]` | ✅ OK |
| SelectContent | `z-50` | ❌ Thấp hơn modal! |
| DropdownMenuContent | `z-50` | ❌ Thấp hơn modal! |
| PopoverContent | `z-50` | ❌ Thấp hơn modal! |

**Root cause:** Shadcn/ui Select component sử dụng Portal để render dropdown ra ngoài parent, NHƯNG z-index chỉ là `z-50` (= 50), trong khi Dialog có z-index là `10002`. Do đó dropdown bị che khuất phía dưới modal!

---

## ✅ Giải Pháp Fix Toàn Diện

### 1. Tăng z-index cho SelectContent (select.tsx)

**File:** `src/components/ui/select.tsx`

**Thay đổi dòng 68-69:**
- Cũ: `z-50`
- Mới: `z-[10003]` (cao hơn DialogContent z-[10002])

**Thêm styles:**
- Background solid: `bg-white dark:bg-gray-900` (không transparent)
- Border gradient: `border-2 border-cosmic-cyan/30`
- Shadow glow: `shadow-[0_0_20px_rgba(0,231,255,0.3)]`
- Rounded: `rounded-xl`

### 2. Tăng z-index cho DropdownMenuContent (dropdown-menu.tsx)

**File:** `src/components/ui/dropdown-menu.tsx`

**Thay đổi dòng 63-64:**
- Cũ: `z-50`
- Mới: `z-[10003]`

**Thêm styles tương tự:**
- `bg-white dark:bg-gray-900`
- `border border-cosmic-cyan/30`
- `shadow-lg`

### 3. Tăng z-index cho PopoverContent (popover.tsx)

**File:** `src/components/ui/popover.tsx`

**Thay đổi dòng 19-20:**
- Cũ: `z-50`
- Mới: `z-[10003]`

**Thêm styles:**
- `bg-white dark:bg-gray-900`
- `border border-cosmic-cyan/30`

### 4. Tăng z-index cho DropdownMenuSubContent (dropdown-menu.tsx)

**Thay đổi dòng 46-47:**
- Cũ: `z-50`
- Mới: `z-[10004]` (cao hơn parent dropdown)

---

## 🎨 Design System Compliance

Tất cả dropdown sẽ được style theo FUN PLAY Design System v1.0:

```text
Background:     bg-white dark:bg-gray-900 (solid, không transparent)
Border:         border border-cosmic-cyan/30 (gradient cyan subtle)
Shadow:         shadow-lg shadow-cyan-500/10 (glow effect nhẹ)
Rounded:        rounded-xl (bo góc đẹp)
Animation:      Giữ nguyên fade-in/zoom-in hiện tại
Max-height:     max-h-96 (384px, scroll nếu dài)
```

---

## 📁 Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/components/ui/select.tsx` | `z-50` → `z-[10003]` + styles |
| `src/components/ui/dropdown-menu.tsx` | `z-50` → `z-[10003]` + `z-[10004]` cho SubContent |
| `src/components/ui/popover.tsx` | `z-50` → `z-[10003]` + styles |

---

## 🔧 Chi Tiết Code Changes

### select.tsx (dòng 68-69)
```tsx
// Thay đổi className trong SelectContent
className={cn(
  "relative z-[10003] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-cosmic-cyan/30 bg-white dark:bg-gray-900 text-popover-foreground shadow-lg shadow-cyan-500/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  position === "popper" && "...",
  className,
)}
```

### dropdown-menu.tsx (dòng 63-65)
```tsx
// Thay đổi className trong DropdownMenuContent
className={cn(
  "z-[10003] min-w-[8rem] overflow-hidden rounded-xl border border-cosmic-cyan/30 bg-white dark:bg-gray-900 p-1 text-popover-foreground shadow-lg shadow-cyan-500/10 data-[state=open]:animate-in data-[state=closed]:animate-out ...",
  className,
)}
```

### dropdown-menu.tsx (dòng 46-48 - SubContent)
```tsx
// Thay đổi className trong DropdownMenuSubContent
className={cn(
  "z-[10004] min-w-[8rem] overflow-hidden rounded-xl border border-cosmic-cyan/30 bg-white dark:bg-gray-900 p-1 text-popover-foreground shadow-lg ...",
  className,
)}
```

### popover.tsx (dòng 19-21)
```tsx
// Thay đổi className trong PopoverContent
className={cn(
  "z-[10003] w-72 rounded-xl border border-cosmic-cyan/30 bg-white dark:bg-gray-900 p-4 text-popover-foreground shadow-lg shadow-cyan-500/10 outline-none data-[state=open]:animate-in ...",
  className,
)}
```

---

## 🧪 Testing Checklist

Sau khi fix, test các trường hợp:

1. **Modal Thưởng & Tặng:**
   - [ ] Mở modal → bấm chọn token → dropdown nổi hoàn toàn trên modal
   - [ ] Dropdown hiển thị đầy đủ 4 token (FUNM, CAMLY, BNB, USDT)
   - [ ] Scroll mượt nếu có nhiều token
   - [ ] Click chọn token → dropdown đóng, token được chọn

2. **Các dropdown khác:**
   - [ ] Dropdown trong Header (user menu)
   - [ ] Dropdown trong Wallet page
   - [ ] Popover/Datepicker trong forms
   - [ ] Tất cả đều nổi trên các modal khác

3. **Mobile:**
   - [ ] Dropdown responsive, không bị tràn màn hình
   - [ ] Touch-friendly, dễ chọn

---

## 📊 Tổng Kết

| Trước Fix | Sau Fix |
|-----------|---------|
| Dropdown z-50 (50) | Dropdown z-[10003] (10003) |
| Bị che bởi Dialog z-[10002] | Nổi trên Dialog |
| Không style đẹp | Gradient border + glow shadow |
| Có thể transparent | Background solid |

**Thời gian thực hiện:** ~10 phút

Kế hoạch này sẽ fix dứt điểm vấn đề dropdown bị che khuất trong modal, áp dụng cho toàn bộ hệ thống và đảm bảo Design System consistency!
