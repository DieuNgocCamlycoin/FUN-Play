
# 🔧 Fix Tính Năng Modal "Thưởng & Tặng" - Các Mục Không Hoạt Động

## 📋 Phân Tích Vấn Đề

Dựa trên screenshots và code review, em đã xác định được **4 lỗi chính** trong modal:

### Vấn đề #1: Người Nhận - Không chọn được từ dropdown
**Nguyên nhân:** Dropdown search results có `z-50` (= 50), thấp hơn DialogContent `z-[10002]` (= 10002). Do đó dropdown bị che khuất và click events không hoạt động.

**Code hiện tại (dòng 340):**
```tsx
<div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-48 overflow-y-auto">
```

### Vấn đề #2: Chọn Token - Không chọn được token khác
**Nguyên nhân:** Mặc dù SelectContent đã có `z-[10003]`, nhưng có thể Select component đang không trigger onValueChange đúng cách hoặc tokens chưa được load.

### Vấn đề #3: Số Tiền - Không chọn/nhập được
**Nguyên nhân:** Các Quick Amount buttons đang bị `disabled` khi `currentBalance !== null && qa > currentBalance`. Nếu balance = 0, tất cả buttons đều disabled. Input cũng có thể bị event blocking.

### Vấn đề #4: Lời Nhắn - Không nhập được
**Nguyên nhân:** Có thể có CSS hoặc event issues blocking textarea input. Cần kiểm tra nếu có overlay che phủ.

---

## ✅ Giải Pháp Chi Tiết

### Fix #1: Tăng z-index cho Search Results Dropdown

**File:** `src/components/Donate/EnhancedDonateModal.tsx`

**Thay đổi dòng 340:**
- Cũ: `className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-48 overflow-y-auto"`
- Mới: `className="absolute z-[10003] w-full mt-1 bg-white dark:bg-gray-900 border border-cosmic-cyan/30 rounded-xl shadow-lg shadow-cyan-500/10 max-h-48 overflow-y-auto"`

### Fix #2: Đảm bảo Token Selection hoạt động

**Kiểm tra:**
- Đảm bảo `tokens` array được load đúng
- Thêm log để debug nếu cần
- Xác nhận `onValueChange` handler được gọi

**Code cần review:**
```tsx
<Select value={selectedToken?.symbol} onValueChange={handleSelectToken}>
```

### Fix #3: Fix Amount Buttons và Input

**Vấn đề:** Khi balance = 0, tất cả buttons đều disabled
**Giải pháp:** Chỉ disable khi token là "internal" VÀ balance < amount

**Thay đổi dòng 433:**
```tsx
disabled={selectedToken?.chain === "internal" && currentBalance !== null && qa > currentBalance}
```

### Fix #4: Đảm bảo Textarea hoạt động

**Kiểm tra:** Xác nhận không có overlay hoặc CSS blocking
**Thêm:** explicit pointer-events-auto nếu cần

---

## 📁 Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/components/Donate/EnhancedDonateModal.tsx` | Fix z-index dropdown, button disabled logic, pointer-events |

---

## 🔧 Chi Tiết Code Changes

### EnhancedDonateModal.tsx

**1. Fix Search Results Dropdown (dòng 340):**
```tsx
// Thay đổi z-50 thành z-[10003] và thêm styles
<div className="absolute z-[10003] w-full mt-1 bg-white dark:bg-gray-900 border border-cosmic-cyan/30 rounded-xl shadow-lg shadow-cyan-500/10 max-h-48 overflow-y-auto">
```

**2. Fix Button trong search results (dòng 347-366):**
```tsx
<button
  key={result.id}
  type="button"  // Thêm type="button" để tránh form submission
  onClick={() => handleSelectReceiver(result)}
  className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors cursor-pointer"
>
```

**3. Fix Quick Amount Buttons disabled logic (dòng 433):**
```tsx
disabled={selectedToken?.chain === "internal" && currentBalance !== null && currentBalance > 0 && qa > currentBalance}
```
Giải thích: Chỉ disable khi:
- Token là internal (FUN MONEY, etc.)
- Có balance (không null)  
- Balance > 0 (có số dư)
- Amount > balance (vượt quá số dư)

**4. Thêm pointer-events cho các interactive elements:**
```tsx
// Input amount
<Input
  type="text"
  inputMode="decimal"
  placeholder="Hoặc nhập số tùy chọn..."
  value={amount}
  onChange={(e) => handleAmountChange(e.target.value)}
  className="text-lg font-bold text-center hologram-input pointer-events-auto"
/>

// Textarea
<Textarea
  placeholder="Gửi lời nhắn đến người nhận..."
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  maxLength={200}
  rows={3}
  className="hologram-input pr-10 resize-none pointer-events-auto"
/>
```

---

## 🧪 Testing Checklist

Sau khi fix, cần test:

1. **Người nhận:**
   - [ ] Nhập tên → dropdown hiển thị users
   - [ ] Click user → user được chọn, dropdown đóng
   - [ ] Hiển thị avatar + tên người nhận

2. **Chọn Token:**
   - [ ] Click dropdown → hiện tất cả tokens
   - [ ] Click CAMLY COIN → token đổi sang CAMLY
   - [ ] Balance hiển thị đúng theo token

3. **Số tiền:**
   - [ ] Click 10/50/100/500 → số được chọn
   - [ ] Nhập số vào input → số hiển thị
   - [ ] Slider kéo → số thay đổi

4. **Lời nhắn:**
   - [ ] Click vào textarea → có thể focus
   - [ ] Gõ chữ → chữ hiển thị
   - [ ] Click emoji → emoji được thêm

---

## 📊 Tổng Kết

| Vấn đề | Nguyên nhân | Fix |
|--------|-------------|-----|
| Không chọn được người nhận | z-index thấp (z-50 < z-10002) | Tăng lên z-[10003] |
| Không chọn token khác | Có thể do Select component | Verify và fix nếu cần |
| Không chọn số tiền | Buttons bị disabled khi balance=0 | Fix disabled logic |
| Không nhập lời nhắn | Có thể bị event blocking | Thêm pointer-events-auto |

**Thời gian thực hiện:** ~10 phút
