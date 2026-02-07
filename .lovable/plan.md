
# 🔧 Fix Triệt Để Modal "Thưởng & Tặng" - Chống Reset Loop

## 📋 Nguyên Nhân Gốc

Khi gộp từ multi-step sang single-page, **useEffect khởi tạo** vẫn chạy theo logic cũ nhưng với dependency không stable:

```tsx
useEffect(() => {
  if (open) {
    fetchTokens().then(...);     // fetchTokens thay đổi mỗi render!
    setSelectedReceiver(null);   // ← Reset mọi thứ
    setAmount("");
    setMessage("");
  }
}, [open, ..., fetchTokens]);    // ← fetchTokens là dependency không stable
```

**`fetchTokens` không được memoize** → mỗi lần render tạo function mới → dependency thay đổi → effect chạy lại → reset form!

---

## ✅ Giải Pháp

### Fix #1: Memoize `fetchTokens` trong useDonation.ts

**File:** `src/hooks/useDonation.ts`

```tsx
import { useState, useCallback } from "react";  // ← Thêm useCallback

const fetchTokens = useCallback(async () => {
  const { data, error } = await supabase
    .from("donate_tokens")
    .select("*")
    .eq("is_enabled", true)
    .order("priority", { ascending: true });

  if (!error && data) {
    setTokens(data as DonationToken[]);
  }
  return data as DonationToken[] || [];
}, []);  // ← Empty dependency = stable reference
```

### Fix #2: Sử dụng `useRef` để chỉ init 1 lần khi modal mở

**File:** `src/components/Donate/EnhancedDonateModal.tsx`

Thêm ref để track trạng thái đã khởi tạo:

```tsx
import { useState, useEffect, useRef } from "react";  // ← Thêm useRef

// Trong component:
const didInitRef = useRef(false);

useEffect(() => {
  // Khi modal đóng, reset flag để lần mở tiếp theo sẽ init lại
  if (!open) {
    didInitRef.current = false;
    return;
  }
  
  // Đã init rồi thì không chạy lại
  if (didInitRef.current) return;
  didInitRef.current = true;
  
  // Chỉ init 1 lần duy nhất khi modal vừa mở
  fetchTokens().then((fetchedTokens) => {
    if (fetchedTokens && fetchedTokens.length > 0) {
      const sorted = [...fetchedTokens].sort((a, b) => a.priority - b.priority);
      setSelectedToken(sorted[0]);
    }
  });

  if (defaultReceiverId) {
    setSelectedReceiver({
      id: defaultReceiverId,
      username: defaultReceiverName || "",
      display_name: defaultReceiverName || null,
      avatar_url: defaultReceiverAvatar || null,
      wallet_address: defaultReceiverWallet || null,
    });
    setShowSearch(false);
  } else {
    setSelectedReceiver(null);
    setShowSearch(true);
  }

  setAmount("");
  setMessage("");
  setShowSuccess(false);
  setCompletedTransaction(null);
}, [open, defaultReceiverId, defaultReceiverName, defaultReceiverAvatar, defaultReceiverWallet]);
// ← Loại bỏ fetchTokens khỏi dependency
```

### Fix #3: Sửa `Dialog onOpenChange` để không reset khi đang tương tác

```tsx
<Dialog 
  open={open} 
  onOpenChange={(nextOpen) => {
    if (!nextOpen) {
      handleClose();
    }
  }}
>
```

### Fix #4: Thêm pointer-events cho `.hologram-input-trigger`

**File:** `src/index.css`

```css
.hologram-input-trigger {
  position: relative;
  border: 1px solid transparent !important;
  background: 
    linear-gradient(hsl(var(--background)), hsl(var(--background))) padding-box,
    linear-gradient(135deg, 
      hsl(var(--cosmic-cyan)), 
      hsl(var(--cosmic-magenta)), 
      hsl(var(--cosmic-gold))
    ) border-box !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto !important;
  isolation: isolate;
}
```

---

## 📁 Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/hooks/useDonation.ts` | Thêm `useCallback` cho `fetchTokens` |
| `src/components/Donate/EnhancedDonateModal.tsx` | Thêm `useRef` để init 1 lần, sửa Dialog onOpenChange |
| `src/index.css` | Thêm pointer-events cho `.hologram-input-trigger` |

---

## 🔧 Chi Tiết Code Changes

### 1. useDonation.ts

**Dòng 1 - Thêm import useCallback:**
```tsx
import { useState, useCallback } from "react";
```

**Dòng 60-71 - Wrap fetchTokens bằng useCallback:**
```tsx
const fetchTokens = useCallback(async () => {
  const { data, error } = await supabase
    .from("donate_tokens")
    .select("*")
    .eq("is_enabled", true)
    .order("priority", { ascending: true });

  if (!error && data) {
    setTokens(data as DonationToken[]);
  }
  return data as DonationToken[] || [];
}, []);
```

### 2. EnhancedDonateModal.tsx

**Dòng 1 - Thêm useRef:**
```tsx
import { useState, useEffect, useRef } from "react";
```

**Dòng 85 (sau senderProfile state) - Thêm ref:**
```tsx
// Track if modal has been initialized this session
const didInitRef = useRef(false);
```

**Dòng 101-133 - Sửa lại useEffect init:**
```tsx
useEffect(() => {
  if (!open) {
    didInitRef.current = false;
    return;
  }
  
  if (didInitRef.current) return;
  didInitRef.current = true;
  
  fetchTokens().then((fetchedTokens) => {
    if (fetchedTokens && fetchedTokens.length > 0) {
      const sorted = [...fetchedTokens].sort((a, b) => a.priority - b.priority);
      setSelectedToken(sorted[0]);
    }
  });

  if (defaultReceiverId) {
    setSelectedReceiver({
      id: defaultReceiverId,
      username: defaultReceiverName || "",
      display_name: defaultReceiverName || null,
      avatar_url: defaultReceiverAvatar || null,
      wallet_address: defaultReceiverWallet || null,
    });
    setShowSearch(false);
  } else {
    setSelectedReceiver(null);
    setShowSearch(true);
  }

  setAmount("");
  setMessage("");
  setShowSuccess(false);
  setCompletedTransaction(null);
}, [open, defaultReceiverId, defaultReceiverName, defaultReceiverAvatar, defaultReceiverWallet]);
```

**Dòng 250 - Sửa Dialog onOpenChange:**
```tsx
<Dialog 
  open={open} 
  onOpenChange={(nextOpen) => {
    if (!nextOpen) handleClose();
  }}
>
```

### 3. index.css

**Thêm sau `.hologram-input` (khoảng dòng 445):**
```css
.hologram-input-trigger {
  position: relative;
  border: 1px solid transparent !important;
  background: 
    linear-gradient(hsl(var(--background)), hsl(var(--background))) padding-box,
    linear-gradient(135deg, 
      hsl(var(--cosmic-cyan)), 
      hsl(var(--cosmic-magenta)), 
      hsl(var(--cosmic-gold))
    ) border-box !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto !important;
  isolation: isolate;
}

.hologram-input-trigger:focus,
.hologram-input-trigger:focus-within {
  box-shadow: 
    0 0 8px hsla(var(--cosmic-cyan), 0.5),
    0 0 16px hsla(var(--cosmic-magenta), 0.3),
    0 0 24px hsla(var(--cosmic-gold), 0.2);
  animation: input-glow-pulse 1.5s ease-in-out infinite;
}
```

---

## 🧪 Testing Checklist

Sau khi fix:

1. **Người nhận:**
   - [ ] Tìm user → click chọn → giữ nguyên, không biến mất
   - [ ] Click X để đổi user khác → hoạt động

2. **Chọn Token:**
   - [ ] Click dropdown → chọn CAMLY → giữ nguyên CAMLY
   - [ ] Chọn BNB → giữ nguyên BNB
   - [ ] Không tự nhảy về FUN MONEY

3. **Số tiền:**
   - [ ] Click 10/50/100/500 → số được chọn và giữ nguyên
   - [ ] Nhập số vào input → giữ nguyên số đã nhập
   - [ ] Kéo slider → giữ nguyên

4. **Lời nhắn:**
   - [ ] Click vào textarea → focus được
   - [ ] Gõ chữ → giữ nguyên chữ đã gõ
   - [ ] Click emoji → emoji được thêm và giữ nguyên

5. **Flow hoàn chỉnh:**
   - [ ] Chọn user → chọn token → nhập amount → nhập message → bấm Tặng
   - [ ] Thành công hiển thị overlay celebration

---

## 📊 Tổng Kết

| Vấn đề | Nguyên nhân gốc | Fix |
|--------|-----------------|-----|
| User biến mất sau khi chọn | `useEffect` reset state liên tục | `useRef` để init 1 lần duy nhất |
| Token nhảy về FUN MONEY | `fetchTokens` không stable → dependency thay đổi | `useCallback` cho `fetchTokens` |
| Không nhập được amount/message | State bị reset khi gõ | Loại `fetchTokens` khỏi dependency |
| Select bị block | Thiếu pointer-events | Thêm CSS cho `.hologram-input-trigger` |

**Đây là bài học quan trọng:** Khi chuyển từ multi-step sang single-page, cần đặc biệt chú ý đến **dependency của useEffect** và **memoization của functions**!

**Thời gian thực hiện:** ~10 phút
