

# Kế Hoạch Sửa Lỗi "Phần Thưởng Chờ Claim = 0" và Cập Nhật Real-Time

## 1. Chẩn Đoán Vấn Đề

### Dữ Liệu Hiện Tại Của Bạn

| Trường | Giá Trị |
|--------|---------|
| `pending_rewards` | 50,000 CAMLY |
| `approved_reward` | 0 |
| Trạng thái reward | `approved: false` (chưa được Admin duyệt) |

### Nguyên Nhân Hiển Thị "0"

**Trong `UnifiedClaimButton.tsx`:**
- **Line 66-71**: Đang fetch `reward_transactions` với điều kiện `claimed=false` và `status=success`
- **KHÔNG lọc theo `approved`** → nên `totalUnclaimed` đúng ra phải là 50,000
- **NHƯNG** component chỉ fetch 1 lần khi mount, không có real-time subscription

**Trong `ClaimRewardsModal.tsx`:**
- **Line 93-98**: Cũng fetch với điều kiện tương tự
- **Line 108-123**: Phân tách đúng `approved` vs `pending`
- **NHƯNG** chỉ fetch khi modal mở, không có real-time subscription

### Vấn Đề Real-Time

1. **`UnifiedClaimButton`**: Chỉ lắng nghe window events `camly-reward` và `reward-claimed`
2. **Không ai dispatch events đó**: `useAutoReward.ts` không dispatch event sau khi award thành công
3. **Không có Supabase Realtime subscription**: UI không tự động refresh khi database thay đổi

---

## 2. Giải Pháp Chi Tiết

### A) Thêm Supabase Realtime Subscription vào `UnifiedClaimButton.tsx`

```typescript
// Thêm subscription realtime cho reward_transactions và profiles
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel('unified-claim-rewards')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reward_transactions',
        filter: `user_id=eq.${user.id}`
      },
      () => fetchRewards()
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      },
      () => fetchRewards()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id, fetchRewards]);
```

### B) Thêm Supabase Realtime Subscription vào `ClaimRewardsModal.tsx`

```typescript
// Subscribe realtime khi modal mở
useEffect(() => {
  if (!open || !user?.id) return;

  const channel = supabase
    .channel('claim-modal-rewards')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reward_transactions',
        filter: `user_id=eq.${user.id}`
      },
      () => fetchUnclaimedRewards()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [open, user?.id]);
```

### C) Dispatch `camly-reward` Event Sau Khi Award Thành Công

**Trong `useAutoReward.ts` (line 51-61):**

```typescript
if (data?.success) {
  console.log(`[Reward] ${data.amount} CAMLY for ${type}`);

  // THÊM: Dispatch event để UI cập nhật ngay lập tức
  window.dispatchEvent(new CustomEvent("camly-reward", { 
    detail: { 
      type, 
      amount: data.amount, 
      autoApproved: data.autoApproved 
    } 
  }));

  return { success: true, ... };
}
```

### D) Dispatch Event Khi Admin Duyệt Reward

**Trong `useRewardRealtimeNotification.ts` (line 38-65):**

```typescript
// Sau khi hiển thị toast, dispatch event để UI cập nhật
if (newData.approved === true && oldData.approved === false) {
  // ... existing code (confetti, toast) ...

  // THÊM: Dispatch event để UnifiedClaimButton cập nhật
  window.dispatchEvent(new CustomEvent("camly-reward", { 
    detail: { 
      approved: true, 
      amount 
    } 
  }));
}
```

### E) Dispatch `reward-claimed` Event Sau Khi Claim Thành Công

**Trong `ClaimRewardsModal.tsx` (sau line 200):**

```typescript
if (data.success) {
  setClaimSuccess(true);
  setTxHash(data.txHash);
  
  // THÊM: Dispatch event để cập nhật UI
  window.dispatchEvent(new CustomEvent("reward-claimed", { 
    detail: { 
      txHash: data.txHash, 
      amount: data.amount 
    } 
  }));

  // ... existing confetti + toast code ...
}
```

---

## 3. Tóm Tắt Các File Cần Thay Đổi

| File | Thay Đổi |
|------|----------|
| `src/components/Rewards/UnifiedClaimButton.tsx` | Thêm Supabase realtime subscription cho `reward_transactions` và `profiles` |
| `src/components/Rewards/ClaimRewardsModal.tsx` | Thêm realtime subscription khi modal mở + dispatch `reward-claimed` event |
| `src/hooks/useAutoReward.ts` | Dispatch `camly-reward` event sau khi award thành công |
| `src/hooks/useRewardRealtimeNotification.ts` | Dispatch `camly-reward` event khi admin duyệt reward |

---

## 4. Kết Quả Mong Đợi

Sau khi sửa:

1. **Nút Claim Button trên Header/Mobile** sẽ cập nhật ngay lập tức khi:
   - Nhận reward mới (xem video, like, comment, etc.)
   - Admin duyệt reward
   - User claim reward

2. **Modal Claim Rewards** sẽ cập nhật real-time khi đang mở:
   - Số liệu "Phần thưởng đã duyệt" và "Chờ duyệt" refresh tự động
   - Progress bar cập nhật ngay khi admin duyệt thêm reward

3. **Đặc biệt trên Mobile**:
   - Badge số lượng reward trên nút Claim cập nhật real-time
   - Không cần refresh trang để thấy thay đổi

---

## 5. Technical Details

### Realtime Publication

Các bảng `reward_transactions` và `profiles` đã được publish cho Supabase Realtime (đã kiểm tra trong console logs - thấy profile updates đang được nhận).

### Cleanup

Tất cả realtime channels sẽ được cleanup đúng cách khi:
- User logout
- Component unmount  
- Modal đóng

Điều này tránh memory leak và tiết kiệm battery trên mobile.

### Debounce

Có thể cân nhắc thêm debounce 200-300ms nếu có nhiều events liên tiếp, nhưng hiện tại chưa cần thiết vì các updates thường cách nhau vài giây.

