

# Kế Hoạch Thêm Realtime Subscription cho TokenLifecyclePanel

## Tổng Quan

Thêm tính năng realtime subscription để TokenLifecyclePanel tự động cập nhật ngay lập tức khi có thay đổi status của mint_requests (pending → approved → minted → rejected).

---

## Phần I: Kiến Trúc Realtime

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE REALTIME                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐                      ┌──────────────────────┐        │
│   │   mint_requests  │                      │   User Browser       │        │
│   │     (table)      │──── postgres_changes ──>│   FunMoneyPage     │        │
│   │                  │                      │   TokenLifecycle     │        │
│   └──────────────────┘                      └──────────────────────┘        │
│                                                                              │
│   Events: INSERT, UPDATE, DELETE                                            │
│   Filter: user_id = current_user.id                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phần II: Files Cần Thay Đổi

| File | Hành động | Mô tả |
|------|-----------|-------|
| `supabase/migrations/xxx_add_mint_requests_realtime.sql` | **Tạo mới** | Enable realtime cho mint_requests table |
| `src/hooks/useMintRequestRealtime.ts` | **Tạo mới** | Hook quản lý realtime subscription |
| `src/pages/FunMoneyPage.tsx` | **Cập nhật** | Tích hợp realtime hook |

---

## Phần III: Chi Tiết Triển Khai

### Bước 1: Database Migration

Enable realtime cho bảng `mint_requests`:

```sql
-- Enable realtime for mint_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.mint_requests;
```

### Bước 2: Tạo Realtime Hook

**File mới:** `src/hooks/useMintRequestRealtime.ts`

| Tính năng | Mô tả |
|-----------|-------|
| **Subscribe to Changes** | Lắng nghe INSERT, UPDATE trên mint_requests |
| **User Filter** | Chỉ nhận events của user hiện tại |
| **Auto Refetch** | Tự động refetch data khi có thay đổi |
| **Toast Notifications** | Hiển thị thông báo khi status thay đổi |
| **Confetti Animation** | Celebratory effect khi request được minted |
| **Connection Status** | Track trạng thái connection |

**Interface:**

```typescript
interface UseMintRequestRealtimeReturn {
  isConnected: boolean;
  lastUpdate: Date | null;
}
```

**Logic:**
1. Subscribe to `postgres_changes` với filter `user_id=eq.{userId}`
2. Khi có UPDATE event:
   - So sánh old status vs new status
   - Trigger toast notification phù hợp
   - Dispatch custom event để components khác cập nhật
   - Gọi onUpdate callback để refetch data
3. Khi có INSERT event:
   - Trigger toast "Request submitted"
   - Refetch data

### Bước 3: Cập Nhật FunMoneyPage

**Thay đổi chính:**

1. Import và sử dụng `useMintRequestRealtime` hook
2. Truyền `fetchRequests` callback để hook gọi khi có thay đổi
3. Thêm realtime indicator (dot xanh khi connected)
4. Remove manual refresh interval nếu có

---

## Phần IV: Notification Logic

| Transition | Toast Type | Message | Animation |
|------------|------------|---------|-----------|
| pending → approved | Success | "Request đã được duyệt! Sẵn sàng mint." | Glow |
| pending → rejected | Warning | "Request bị từ chối: {reason}" | None |
| approved → minted | Success + Confetti | "FUN tokens đã mint thành công!" | Confetti |
| approved → failed | Error | "Mint thất bại: {reason}" | None |
| * → * (INSERT) | Info | "Request mới đã được tạo" | None |

---

## Phần V: Custom Events

Dispatch events để các components khác có thể react:

```typescript
// Khi status thay đổi
window.dispatchEvent(new CustomEvent("fun-money-update", {
  detail: {
    requestId: payload.new.id,
    oldStatus: payload.old.status,
    newStatus: payload.new.status,
    amount: payload.new.calculated_amount_formatted,
    txHash: payload.new.tx_hash
  }
}));
```

Components có thể lắng nghe:
- TokenLifecyclePanel (auto update)
- MintRequestList (highlight changed item)
- Header badge (update count)

---

## Phần VI: Connection Status UI

Thêm indicator trong FunMoneyPage header:

```text
┌─────────────────────────────────────────────────────────────────┐
│  FUN Money                                    [●] Live  [Wallet] │
│  Proof of Pure Love Protocol                                     │
└─────────────────────────────────────────────────────────────────┘
```

- **●** Xanh: Connected
- **●** Vàng: Connecting
- **●** Đỏ: Disconnected

---

## Phần VII: Error Handling

| Scenario | Handling |
|----------|----------|
| Connection lost | Auto-reconnect với exponential backoff |
| Permission denied | Show toast, fallback to manual refresh |
| Rate limited | Debounce 300ms để giảm updates |
| Invalid payload | Log error, skip update |

---

## Phần VIII: Performance Optimization

1. **Debounce**: 300ms debounce cho multiple rapid updates
2. **Selective Refetch**: Chỉ refetch nếu status thực sự thay đổi
3. **Cleanup**: Properly unsubscribe khi component unmount
4. **Memoization**: useMemo cho processed data

---

## Tóm Tắt Triển Khai

| Bước | Công việc |
|------|-----------|
| 1 | Tạo migration enable realtime cho mint_requests |
| 2 | Tạo hook `useMintRequestRealtime.ts` với subscription logic |
| 3 | Cập nhật `FunMoneyPage.tsx` tích hợp realtime hook |
| 4 | Thêm connection status indicator |
| 5 | Thêm toast notifications và confetti |

**Thời gian ước tính:** 45 phút - 1 giờ

