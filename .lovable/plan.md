

# Sửa tin nhắn trùng lặp và xoá hiệu ứng đồng xu bay

---

## Vấn đề 1: Tin nhắn trùng lặp

Khi tặng tiền, hệ thống gửi **2 tin nhắn** vào chat:
- Tin 1: Từ edge function `create-donation` -- "Đã tặng 10 USDT: ..."
- Tin 2: Từ `GiftCelebrationModal.tsx` khi bấm "Lưu & Gửi" -- "Angel Thu Ha đã tặng bạn 10 USDT!..."

**Giải pháp:** Xoá phần gửi tin nhắn chat trong edge function `create-donation/index.ts` (dòng 170-202), chỉ giữ lại tin nhắn từ `GiftCelebrationModal.tsx` (gửi khi người dùng bấm "Lưu & Gửi").

### Tệp: `supabase/functions/create-donation/index.ts`
- Xoá toàn bộ block code tìm/tạo chat và insert chat_messages (dòng 170-202)
- Giữ nguyên phần return response phía sau

---

## Vấn đề 2: Xoá hiệu ứng đồng xu bay

**Giải pháp:** Xoá component `FlyingCoins` khỏi `MobileAngelMascot.tsx`.

### Tệp: `src/components/Mascot/MobileAngelMascot.tsx`
- Xoá import `FlyingCoins`
- Xoá state `showFlyingCoins` và `coinOrigin`
- Xoá logic `setShowFlyingCoins(true)` và `setCoinOrigin(...)` trong event handler
- Xoá `<FlyingCoins ... />` trong JSX
- Giữ nguyên các hiệu ứng khác (excited, haptic feedback, celebrate sound)

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `supabase/functions/create-donation/index.ts` | Xoá block gửi tin nhắn chat (dòng 170-202) |
| 2 | `src/components/Mascot/MobileAngelMascot.tsx` | Xoá FlyingCoins component và logic liên quan |

